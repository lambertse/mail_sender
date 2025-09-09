package main

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/lambertse/cquan_go_webapp/internal/middleware"
	handler "github.com/lambertse/cquan_go_webapp/internal/transport/handlers"
)

func route() http.Handler {
  mux := chi.NewRouter()

  fileHanlder := handler.NewFileHandler()
  sendMailHander := handler.NewSendMailHandler()
  emailConfigHandler := handler.NewEmailConfigHandler()

  // Global middleware
  mux.Use(middleware.CORS)

  // Public routes (no authentication required)
  mux.Post("/login", handler.LoginHandler)

  // Protected routes (JWT authentication required)
  mux.Group(func(r chi.Router) {
    r.Use(middleware.JWTMiddleware)
    
    r.Post("/upload_file", fileHanlder.SaveFile)
    r.Post("/send_email", sendMailHander.SendEmail)
  })

    mux.Post("/email-config", emailConfigHandler.SaveEmailConfig)
    mux.Get("/email-config", emailConfigHandler.GetEmailConfig)

  return mux
}

