package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/lambertse/cquan_go_webapp/internal/model"
)

type EmailConfigHandler struct{}

type EmailConfigResponse struct {
	Success bool               `json:"success"`
	Message string             `json:"message"`
	Config  *model.EmailConfig `json:"config,omitempty"`
}

func NewEmailConfigHandler() *EmailConfigHandler {
	return &EmailConfigHandler{}
}

func (h *EmailConfigHandler) SaveEmailConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var config model.EmailConfig
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		http.Error(w, `{"success":false,"message":"Invalid JSON format"}`, http.StatusBadRequest)
		return
	}

	// Validate required fields
	if config.Subject == "" {
		http.Error(w, `{"success":false,"message":"Subject is required"}`, http.StatusBadRequest)
		return
	}

	// Save config using model function
	if err := model.SaveEmailConfig(&config); err != nil {
		response := EmailConfigResponse{
			Success: false,
			Message: "Failed to save email configuration: " + err.Error(),
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}

	response := EmailConfigResponse{
		Success: true,
		Message: "Email configuration saved successfully",
		Config:  &config,
	}

	json.NewEncoder(w).Encode(response)
}

func (h *EmailConfigHandler) GetEmailConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Get the latest config using model function
	config, err := model.GetLatestEmailConfig()
	if err != nil {
		response := EmailConfigResponse{
			Success: false,
			Message: "Failed to retrieve email configuration: " + err.Error(),
		}
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(response)
		return
	}

	response := EmailConfigResponse{
		Success: true,
		Message: "Email configuration retrieved successfully",
		Config:  config,
	}

	json.NewEncoder(w).Encode(response)
}
