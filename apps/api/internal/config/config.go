package config

import (
	"os"
)

type Config struct {
	DatabaseURL string
	Port        string
	Environment string
	AdminGroup  string
}

func Load() *Config {
	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://app:secret@localhost:5432/lebedinsky"),
		Port:        getEnv("PORT", "8080"),
		Environment: getEnv("ENVIRONMENT", "development"),
		AdminGroup:  getEnv("ADMIN_GROUP", "admin"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
