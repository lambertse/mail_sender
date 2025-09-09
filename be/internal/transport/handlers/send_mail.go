package handlers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/lambertse/cquan_go_webapp/internal/model"
	"gopkg.in/mail.v2"
)

const sendMailRetryCount = 4

type SendMailHandler struct {
}

func NewSendMailHandler() *SendMailHandler {
	handler := SendMailHandler{}
	return &handler
}

type MailRequest struct {
	Data []model.Receiver `json:"data"`
}

type MailResponse struct {
	Success []model.Receiver `json:"success"`
	Failed  []model.Receiver `json:"failed"`
}

func (h *SendMailHandler) SendEmail(w http.ResponseWriter, r *http.Request) {
    userClaims, err := GetUserFromRequest(r)
	if err != nil {
		log.Printf("Error extracting user from token: %v", err)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	
	from := userClaims.Username
	mailToken := userClaims.MailToken	
    fmt.Printf("Using email: %s\n", from)
    fmt.Printf("Using mail token: %s\n", mailToken)

	if from == "" || mailToken == "" {
		fmt.Errorf("missing environment variables GMAIL_ADDRESS or MAIL_TOKEN")
		http.Error(w, "Internal Server Error: Missing email configuration", http.StatusInternalServerError)
		return
	}

	var mailReq MailRequest
	if err := json.NewDecoder(r.Body).Decode(&mailReq); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Initialize response lists
	var successReceivers []model.Receiver
	var failedReceivers []model.Receiver

	for _, receiver := range mailReq.Data {
		err := sendEmail(from, mailToken, &receiver)
		if err != nil {
            fmt.Println("Error: ", err.Error())
           if strings.Contains(err.Error(), "Username and Password not accepted") {
                log.Printf("Authentication error: %v", err)
                http.Error(w, "Authentication error: Invalid email or mail token", http.StatusForbidden)
                return
           } 
			retryCount := 0
			for retryCount < sendMailRetryCount {
				log.Printf("Retrying to send email to %s, attempt %d", receiver.Email, retryCount+1)
				err = sendEmail(from, mailToken, &receiver)
				if err == nil {
					log.Printf("Email sent successfully to %s", receiver.Email)
					break
				}
				retryCount++
			}
			if retryCount == sendMailRetryCount {
				log.Printf("Failed to send email to %s after %d attempts: %v", receiver.Email, sendMailRetryCount, err)
				failedReceivers = append(failedReceivers, receiver)
				continue
			}
		}
		if err == nil {
			log.Printf("Email sent successfully to %s", receiver.Email)
			successReceivers = append(successReceivers, receiver)
		}
	}

	// Prepare response
	response := MailResponse{
		Success: successReceivers,
		Failed:  failedReceivers,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}

func addAttachmentsToMessage(m *mail.Message, attachments []model.Attachment) error {
	var attachmentDir = filepath.Join(os.TempDir(), "email_configs", "email_attachments")

	for _, attachment := range attachments {
		attachmentPath := filepath.Join(attachmentDir, attachment.Name)

		// Check if attachment file exists
		if _, err := os.Stat(attachmentPath); os.IsNotExist(err) {
			log.Printf("Attachment file not found: %s", attachmentPath)
			continue
		}

		// Read attachment data
		data, err := os.ReadFile(attachmentPath)
		if err != nil {
			log.Printf("Failed to read attachment %s: %v", attachment.Name, err)
			continue
		}

		// Decode base64 data if it's base64 encoded
		if strings.HasPrefix(string(data), "data:") {
			// Extract base64 data after the comma
			parts := strings.SplitN(string(data), ",", 2)
			if len(parts) == 2 {
				decoded, err := base64.StdEncoding.DecodeString(parts[1])
				if err != nil {
					log.Printf("Failed to decode base64 attachment %s: %v", attachment.Name, err)
					continue
				}
				data = decoded
			}
		}

		m.Attach(attachmentPath)
	}

	return nil
}

func sendEmail(from, mailToken string, receiver *model.Receiver) error {
	// Load the saved email configuration
	config, err := model.GetLatestEmailConfig()
	if err != nil {
		return fmt.Errorf("failed to load email configuration: %w", err)
	}

	m := mail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", receiver.Email)
	m.SetHeader("Subject", config.Subject)

	// Get current UTC time in specified format
	currentTime := time.Now().UTC().Format("2006-01-02 15:04:05")
	userName := "tri-le_opswat" // Using the specific user login

	// Check if body contains HTML tags (basic check)
	isHTML := strings.Contains(config.Body, "<") && strings.Contains(config.Body, ">")

	if isHTML {
		// Set HTML body with footer
		htmlBody := fmt.Sprintf("%s",
			config.Body)
		m.SetBody("text/html", htmlBody)
	} else {
		// Set plain text body with footer
		plainBody := fmt.Sprintf("%s\n\n"+
			"----------------------------------------\n"+
			"Current Date and Time (UTC): %s\n"+
			"Current User's Login: %s",
			config.Body, currentTime, userName)
		m.SetBody("text/plain", plainBody)
	}

	// Add attachments from saved configuration
	if len(config.Attachments) > 0 {
		if err := addAttachmentsToMessage(m, config.Attachments); err != nil {
			log.Printf("Warning: Failed to add some attachments: %v", err)
		}
	}

	// Create dialer for SMTP connection
	d := mail.NewDialer("smtp.gmail.com", 587, from, mailToken)
	err = d.DialAndSend(m)
	if err != nil {
		fmt.Printf("Failed to send email: %v\n", err)
		return fmt.Errorf("failed to send email: %w", err)
	}
	return nil
}
