package main

import (
	"context"
	"log"
	"os"

	"github.com/avlebedinsky/lebedinsky-space/api/internal/config"
	"github.com/avlebedinsky/lebedinsky-space/api/internal/db"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect: %v", err)
	}
	defer pool.Close()

	if err := db.Migrate(ctx, pool); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	services := []struct {
		name, description, url, iconName, color string
		order                                   int
	}{
		{"Xray Panel", "Управление прокси и VPN", "https://xui.lebedinsky.space/gvSEtYWTaQItFFIdw2/", "Shield", "#6366f1", 1},
		{"n8n", "Автоматизация рабочих процессов", "https://n8n.lebedinsky.space", "Workflow", "#f59e0b", 2},
		{"Open WebUI", "AI интерфейс", "https://webui.lebedinsky.space", "MessageSquare", "#10b981", 3},
	}

	for _, s := range services {
		_, err := pool.Exec(ctx,
			`INSERT INTO services (name, description, url, icon_name, color, sort_order)
			 VALUES ($1, $2, $3, $4, $5, $6)
			 ON CONFLICT DO NOTHING`,
			s.name, s.description, s.url, s.iconName, s.color, s.order,
		)
		if err != nil {
			log.Printf("seed service %s: %v", s.name, err)
		} else {
			log.Printf("seeded: %s", s.name)
		}
	}

	log.Println("Seed complete")
	os.Exit(0)
}
