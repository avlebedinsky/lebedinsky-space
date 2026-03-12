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
}
