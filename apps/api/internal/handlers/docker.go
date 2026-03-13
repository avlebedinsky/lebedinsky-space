package handlers

import (
	"context"
	"encoding/json"
	"net"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/avlebedinsky/lebedinsky-space/api/internal/models"
)

func dockerClient() (*http.Client, string) {
	host := os.Getenv("DOCKER_HOST")

	if strings.HasPrefix(host, "tcp://") {
		baseURL := "http://" + strings.TrimPrefix(host, "tcp://")
		return &http.Client{Timeout: 5 * time.Second}, baseURL + "/v1.41"
	}

	sockPath := "/var/run/docker.sock"
	if strings.HasPrefix(host, "unix://") {
		sockPath = strings.TrimPrefix(host, "unix://")
	}

	transport := &http.Transport{
		DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
			return (&net.Dialer{}).DialContext(ctx, "unix", sockPath)
		},
	}
	return &http.Client{Transport: transport, Timeout: 5 * time.Second}, "http://unix/v1.41"
}

func Docker(w http.ResponseWriter, r *http.Request) {
	client, baseURL := dockerClient()

	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet,
		baseURL+"/containers/json?all=true", nil)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	resp, err := client.Do(req)
	if err != nil {
		// docker not available — return empty list
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]models.ContainerInfo{})
		return
	}
	defer resp.Body.Close()

	var raw []struct {
		ID     string   `json:"Id"`
		Names  []string `json:"Names"`
		Image  string   `json:"Image"`
		State  string   `json:"State"`
		Status string   `json:"Status"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	result := make([]models.ContainerInfo, 0, len(raw))
	for _, c := range raw {
		name := ""
		if len(c.Names) > 0 {
			name = strings.TrimPrefix(c.Names[0], "/")
		}
		id := c.ID
		if len(id) > 12 {
			id = id[:12]
		}
		image := c.Image
		if at := strings.Index(image, "@"); at != -1 {
			image = image[:at]
		}
		result = append(result, models.ContainerInfo{
			ID:     id,
			Name:   name,
			Image:  image,
			State:  c.State,
			Status: c.Status,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
