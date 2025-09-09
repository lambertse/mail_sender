package model

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type EmailConfig struct {
	Subject     string       `json:"subject"`
	Body        string       `json:"body"`
	Attachments []Attachment `json:"attachments"`
	CreatedAt   time.Time    `json:"created_at"`
}

type Attachment struct {
	Name string `json:"name"`
	Type string `json:"type"`
	Size int64  `json:"size"`
	Data string `json:"data"`
}

var configDir = filepath.Join(os.TempDir(), "email_configs")
var configFileName = "standard_email.json"
var attachmentDir = filepath.Join(os.TempDir(), "email_configs", "email_attachments")

func (e *EmailConfig) PrintEmailConfig() {
	fmt.Println("Subject:", e.Subject)
	fmt.Println("Body:", e.Body)
	fmt.Println("Attachments count:", len(e.Attachments))
	fmt.Println("CreatedAt:", e.CreatedAt)
}

func parseDataURL(dataURL string) ([]byte, error) {
	// Data URL format: data:mime/type;base64,<base64-encoded-data>
	if !strings.HasPrefix(dataURL, "data:") {
		return nil, fmt.Errorf("invalid data URL format")
	}

	// Find the comma that separates the header from the data
	commaIndex := strings.Index(dataURL, ",")
	if commaIndex == -1 {
		return nil, fmt.Errorf("invalid data URL format: missing comma")
	}

	// Extract the base64 data part
	base64Data := dataURL[commaIndex+1:]

	// Decode base64
	return base64.StdEncoding.DecodeString(base64Data)
}

func SaveEmailConfig(config *EmailConfig) error {
	// Remove the configDir if it exists to ensure only one config is stored
	if _, err := os.Stat(configDir); err == nil {
		if err := os.RemoveAll(configDir); err != nil {
			return fmt.Errorf("failed to remove existing config directory: %w", err)
		}
	}

	// Create directory if it doesn't exist
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	// Set creation timestamp
	config.CreatedAt = time.Now()
	path := filepath.Join(configDir, configFileName)

	// Save main config file
	configJSON, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to serialize config: %w", err)
	}

	if err := os.WriteFile(path, configJSON, 0644); err != nil {
		return fmt.Errorf("failed to save config file: %w", err)
	}

	// Save attachments as separate files if they exist
	if len(config.Attachments) > 0 {
		if err := os.MkdirAll(attachmentDir, 0755); err != nil {
			fmt.Printf("Warning: Failed to create attachment directory: %v\n", err)
		} else {
			for _, attachment := range config.Attachments {
				attachmentPath := filepath.Join(attachmentDir, attachment.Name)
				// Parse base64 data URL and decode
				if decoded, err := parseDataURL(attachment.Data); err != nil {
					fmt.Printf("Warning: Failed to decode attachment %s: %v\n", attachment.Name, err)
				} else {
					if err := os.WriteFile(attachmentPath, decoded, 0644); err != nil {
						fmt.Printf("Warning: Failed to save attachment %s: %v\n", attachment.Name, err)
					}
				}
			}
		}
	}

	return nil
}

func GetLatestEmailConfig() (*EmailConfig, error) {
	// Read the latest config file
	configPath := filepath.Join(configDir, configFileName)
	configData, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var config EmailConfig
	if err := json.Unmarshal(configData, &config); err != nil {
		return nil, fmt.Errorf("failed to parse config file: %w", err)
	}

	return &config, nil
}

func (e *EmailConfig) GetEmailConfigAsJSON() string {
	jsonData, _ := json.Marshal(e)
	return string(jsonData)
}
