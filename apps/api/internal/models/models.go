package models

import "time"

type Service struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	URL         string    `json:"url"`
	IconName    string    `json:"iconName"`
	Color       string    `json:"color"`
	SortOrder   int       `json:"sortOrder"`
	Hidden      bool      `json:"hidden"`
	CardColSpan int       `json:"cardColSpan"`
	CardRowSpan int       `json:"cardRowSpan"`
	CreatedAt   time.Time `json:"createdAt"`
}

type User struct {
	Username string `json:"username"`
	IsAdmin  bool   `json:"isAdmin"`
}

type ServiceStatus struct {
	ID     int64  `json:"id"`
	Status string `json:"status"`
}

type ServerMetrics struct {
	Hostname string  `json:"hostname"`
	CPU      float64 `json:"cpu"`
	RAM      float64 `json:"ram"`
	Disk     float64 `json:"disk"`
	Uptime   uint64  `json:"uptime"`
	NetIn    uint64  `json:"netIn"`
	NetOut   uint64  `json:"netOut"`
}

type ContainerInfo struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Image  string `json:"image"`
	State  string `json:"state"`
	Status string `json:"status"`
}

type RSSFeed struct {
	ID        int64     `json:"id"`
	Title     string    `json:"title"`
	URL       string    `json:"url"`
	Hidden    bool      `json:"hidden"`
	ItemLimit int       `json:"itemLimit"`
	CreatedAt time.Time `json:"createdAt"`
}

type RSSItem struct {
	Title       string `json:"title"`
	Link        string `json:"link"`
	Description string `json:"description"`
	Published   string `json:"published"`
}

type RSSFeedWithItems struct {
	Feed  RSSFeed   `json:"feed"`
	Items []RSSItem `json:"items"`
}

type WidgetSpan struct {
	ColSpan int `json:"colSpan"`
	RowSpan int `json:"rowSpan"`
}

type SiteSettings struct {
	BgColor        string                 `json:"bgColor"`
	BgImage        string                 `json:"bgImage"`
	CardColor      string                 `json:"cardColor"`
	AccentColor    string                 `json:"accentColor"`
	BorderColor    string                 `json:"borderColor"`
	TextColor      string                 `json:"textColor"`
	GridOrder      []string               `json:"gridOrder"`
	HiddenWidgets  []string               `json:"hiddenWidgets"`
	WidgetSpans    map[string]WidgetSpan  `json:"widgetSpans"`
	KBRepoURL        string                 `json:"kbRepoURL"`
	KBGithubToken    string                 `json:"kbGithubToken"`
	KBAllowedFolders []string               `json:"kbAllowedFolders"`
}

type KBNode struct {
	Name     string   `json:"name"`
	Path     string   `json:"path"`
	Type     string   `json:"type"`
	Children []KBNode `json:"children,omitempty"`
}

type KBFileContent struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}
