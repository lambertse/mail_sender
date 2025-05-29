package main

import (
	"log"
	"net/http"

	"github.com/lambertse/cquan_go_webapp/internal/config"
)

var appConfig *config.AppConfig 

func main() {
  appConfig, err := config.GetAppConfigFromEnv();
  if err != nil {
    log.Printf("Can not retrieve config from .env, error: %s", err)
  }

  if err != nil {
    log.Fatalf("Failed to connect to database: %v", err)
  }

  server := http.Server{
    Addr: ":" + appConfig.Port,
    Handler: route(),
  }
  log.Printf("Start serving on port %s", appConfig.Port)

  err = server.ListenAndServe();
  if err != nil {
    log.Printf("Serving failed, err: %s", err)
  }
}
