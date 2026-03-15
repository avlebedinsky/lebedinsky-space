package handlers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/avlebedinsky/lebedinsky-space/api/internal/middleware"
	"github.com/avlebedinsky/lebedinsky-space/api/internal/models"
)

type knowledgeTreeCache struct {
	nodes     []models.KBNode
	repoURL   string
	fetchedAt time.Time
}

type knowledgeFileCache struct {
	content   string
	fetchedAt time.Time
}

type KnowledgeHandler struct {
	db        *pgxpool.Pool
	mu        sync.Mutex
	treeCache map[string]*knowledgeTreeCache
	fileCache map[string]*knowledgeFileCache
	ttl       time.Duration
}

func NewKnowledgeHandler(db *pgxpool.Pool) *KnowledgeHandler {
	return &KnowledgeHandler{
		db:        db,
		treeCache: make(map[string]*knowledgeTreeCache),
		fileCache: make(map[string]*knowledgeFileCache),
		ttl:       5 * time.Minute,
	}
}

func (h *KnowledgeHandler) loadConfig(r *http.Request) (repoURL, token string, err error) {
	user := middleware.GetUser(r)
	err = h.db.QueryRow(r.Context(),
		`SELECT kb_repo_url, kb_github_token FROM user_settings WHERE username = $1`,
		user.Username,
	).Scan(&repoURL, &token)
	if err != nil {
		err = nil
	}
	return
}

func parseOwnerRepo(repoURL string) (owner, repo string, err error) {
	cleaned := strings.TrimPrefix(repoURL, "https://github.com/")
	cleaned = strings.TrimPrefix(cleaned, "http://github.com/")
	cleaned = strings.TrimPrefix(cleaned, "github.com/")
	cleaned = strings.TrimSuffix(cleaned, ".git")
	cleaned = strings.Trim(cleaned, "/")
	parts := strings.SplitN(cleaned, "/", 2)
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return "", "", fmt.Errorf("invalid repo URL: %s", repoURL)
	}
	return parts[0], parts[1], nil
}

type githubError struct {
	status int
	msg    string
}

func (e *githubError) Error() string { return e.msg }

func githubRequest(apiURL, token string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "lebedinsky-space-kb/1.0")
	req.Header.Set("Accept", "application/vnd.github+json")
	if token != "" {
		req.Header.Set("Authorization", "token "+token)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("не удалось подключиться к GitHub: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode == http.StatusOK {
		return body, nil
	}

	switch resp.StatusCode {
	case http.StatusUnauthorized:
		return nil, &githubError{status: resp.StatusCode, msg: "неверный или истёкший GitHub токен"}
	case http.StatusForbidden:
		return nil, &githubError{status: resp.StatusCode, msg: "доступ запрещён: проверь права токена (нужен scope repo или Contents: Read-only)"}
	case http.StatusNotFound:
		return nil, &githubError{status: resp.StatusCode, msg: "репозиторий не найден: проверь URL и права токена"}
	default:
		return nil, &githubError{status: resp.StatusCode, msg: fmt.Sprintf("GitHub API вернул %s", resp.Status)}
	}
}

func buildTree(paths []string) []models.KBNode {
	type mutableNode struct {
		Name     string
		Path     string
		Type     string
		Children map[string]*mutableNode
	}

	root := make(map[string]*mutableNode)

	for _, p := range paths {
		parts := strings.Split(p, "/")
		current := root
		for i, part := range parts {
			if _, exists := current[part]; !exists {
				nodeType := "dir"
				nodePath := strings.Join(parts[:i+1], "/")
				if i == len(parts)-1 {
					nodeType = "file"
				}
				current[part] = &mutableNode{
					Name:     part,
					Path:     nodePath,
					Type:     nodeType,
					Children: make(map[string]*mutableNode),
				}
			}
			current = current[part].Children
		}
	}

	var toSlice func(m map[string]*mutableNode) []models.KBNode
	toSlice = func(m map[string]*mutableNode) []models.KBNode {
		names := make([]string, 0, len(m))
		for name := range m {
			names = append(names, name)
		}
		sort.Slice(names, func(i, j int) bool {
			ni, nj := m[names[i]], m[names[j]]
			if ni.Type != nj.Type {
				return ni.Type == "dir"
			}
			return names[i] < names[j]
		})

		nodes := make([]models.KBNode, 0, len(names))
		for _, name := range names {
			mn := m[name]
			n := models.KBNode{
				Name: mn.Name,
				Path: mn.Path,
				Type: mn.Type,
			}
			if len(mn.Children) > 0 {
				n.Children = toSlice(mn.Children)
			}
			nodes = append(nodes, n)
		}
		return nodes
	}

	return toSlice(root)
}

func (h *KnowledgeHandler) GetTree(w http.ResponseWriter, r *http.Request) {
	username := middleware.GetUser(r).Username
	repoURL, token, err := h.loadConfig(r)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	if repoURL == "" {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("[]"))
		return
	}

	h.mu.Lock()
	if c := h.treeCache[username]; c != nil && c.repoURL == repoURL && time.Since(c.fetchedAt) < h.ttl {
		cached := c.nodes
		h.mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(cached)
		return
	}
	h.mu.Unlock()

	owner, repo, err := parseOwnerRepo(repoURL)
	if err != nil {
		http.Error(w, "Invalid repo URL configured", http.StatusBadGateway)
		return
	}

	apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/git/trees/HEAD?recursive=1", owner, repo)
	body, err := githubRequest(apiURL, token)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}

	var treeResp struct {
		Tree []struct {
			Path string `json:"path"`
			Type string `json:"type"` // "blob" | "tree"
		} `json:"tree"`
	}
	if err := json.Unmarshal(body, &treeResp); err != nil {
		http.Error(w, "Failed to parse GitHub response", http.StatusBadGateway)
		return
	}

	var mdPaths []string
	for _, item := range treeResp.Tree {
		if item.Type == "blob" && strings.HasSuffix(item.Path, ".md") {
			mdPaths = append(mdPaths, item.Path)
		}
	}

	nodes := buildTree(mdPaths)

	h.mu.Lock()
	h.treeCache[username] = &knowledgeTreeCache{nodes: nodes, repoURL: repoURL, fetchedAt: time.Now()}
	h.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(nodes)
}

func (h *KnowledgeHandler) GetFile(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	if path == "" {
		http.Error(w, "path query parameter required", http.StatusBadRequest)
		return
	}
	// Prevent path traversal
	if strings.Contains(path, "..") || strings.HasPrefix(path, "/") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	username := middleware.GetUser(r).Username
	repoURL, token, err := h.loadConfig(r)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	if repoURL == "" {
		http.Error(w, "Knowledge base not configured", http.StatusNotFound)
		return
	}

	cacheKey := username + ":" + repoURL + ":" + path
	h.mu.Lock()
	if cached, ok := h.fileCache[cacheKey]; ok && time.Since(cached.fetchedAt) < h.ttl {
		content := cached.content
		h.mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(models.KBFileContent{Path: path, Content: content})
		return
	}
	h.mu.Unlock()

	owner, repo, err := parseOwnerRepo(repoURL)
	if err != nil {
		http.Error(w, "Invalid repo URL configured", http.StatusBadGateway)
		return
	}

	apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/contents/%s", owner, repo, url.PathEscape(path))
	body, err := githubRequest(apiURL, token)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}

	var fileResp struct {
		Content  string `json:"content"`
		Encoding string `json:"encoding"`
	}
	if err := json.Unmarshal(body, &fileResp); err != nil {
		http.Error(w, "Failed to parse GitHub response", http.StatusBadGateway)
		return
	}
	if fileResp.Encoding != "base64" {
		http.Error(w, "Unexpected file encoding", http.StatusBadGateway)
		return
	}

	// GitHub returns base64 with newlines
	cleaned := strings.ReplaceAll(fileResp.Content, "\n", "")
	decoded, err := base64.StdEncoding.DecodeString(cleaned)
	if err != nil {
		http.Error(w, "Failed to decode file content", http.StatusBadGateway)
		return
	}

	content := string(decoded)

	h.mu.Lock()
	h.fileCache[cacheKey] = &knowledgeFileCache{content: content, fetchedAt: time.Now()}
	h.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.KBFileContent{Path: path, Content: content})
}
