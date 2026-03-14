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
	Status string `json:"status"` // "up" | "down" | "unknown"
}

type ServerMetrics struct {
	Hostname string  `json:"hostname"`
	CPU      float64 `json:"cpu"`
	RAM      float64 `json:"ram"`
	Disk     float64 `json:"disk"`
	Uptime   uint64  `json:"uptime"`  // seconds since boot
	NetIn    uint64  `json:"netIn"`   // cumulative bytes received
	NetOut   uint64  `json:"netOut"`  // cumulative bytes sent
}

type ContainerInfo struct {
	ID     string `json:"id"`     // first 12 chars
	Name   string `json:"name"`   // without leading "/"
	Image  string `json:"image"`  // image name without digest
	State  string `json:"state"`  // "running", "exited", etc.
	Status string `json:"status"` // human-readable, e.g. "Up 3 days"
}

type RSSFeed struct {
	ID        int64     `json:"id"`
	Title     string    `json:"title"`
	URL       string    `json:"url"`
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
	BgColor       string                 `json:"bgColor"`
	BgImage       string                 `json:"bgImage"`
	CardColor     string                 `json:"cardColor"`
	AccentColor   string                 `json:"accentColor"`
	BorderColor   string                 `json:"borderColor"`
	TextColor     string                 `json:"textColor"`
	GridOrder     []string               `json:"gridOrder"`
	HiddenWidgets []string               `json:"hiddenWidgets"`
	WidgetSpans   map[string]WidgetSpan  `json:"widgetSpans"`
}
