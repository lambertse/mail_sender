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

  // Create Handler
  mux.Use(middleware.CORS)
  mux.Post("/upload_file", fileHanlder.SaveFile)
  mux.Post("/send_email", sendMailHander.SendEmail)

  //

  return mux
}
