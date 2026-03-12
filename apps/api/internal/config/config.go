package config

import (
	"os"
)

type Config struct {
	DatabaseURL string
	Port        string
	Environment string
	AdminGroup  string
	CORSOrigin  string
}

func Load() *Config {
	env := getEnv("ENVIRONMENT", "development")
	defaultCORSOrigin := getEnv("CORS_ORIGIN", "")
	if defaultCORSOrigin == "" {
		if env == "development" {
			defaultCORSOrigin = "http://localhost:5173"
		} else {
			defaultCORSOrigin = "https://lebedinsky.space"
		}
	}
	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://app:secret@localhost:5432/lebedinsky"),
		Port:        getEnv("PORT", "8080"),
		Environment: env,
		AdminGroup:  getEnv("ADMIN_GROUP", "admin"),
		CORSOrigin:  defaultCORSOrigin,
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
