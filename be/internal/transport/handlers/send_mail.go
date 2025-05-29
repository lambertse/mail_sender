package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
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

func (h *SendMailHandler) SendEmail(w http.ResponseWriter, r *http.Request) {
	// Handle the request here
	//
	from := os.Getenv("MAIL_ADDR")
	mailToken := os.Getenv("MAIL_TOKEN")
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

	for _, receiver := range mailReq.Data {
		err := sendEmail(from, mailToken, &receiver)
		if err != nil {
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
		}
		log.Printf("Email sent successfully to %s", receiver.Email)
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("User handler response"))
}

func sendEmail(from, mailToken string, receiver *model.Receiver) error {
	log.Printf("Sending email to: %s", receiver.Email)
	m := mail.NewMessage()

	m.SetHeader("From", from)
	m.SetHeader("To", receiver.Email)
	m.SetHeader("Subject", "Test Email from Go Application")

	// Get current UTC time in specified format
	currentTime := time.Now().UTC().Format("2006-01-02 15:04:05")
	userName := "tri-le_opswat" // Using the specific user login

	// Set body with footer based on HTML or plain text

	plainBody := fmt.Sprintf("%s\n\n"+
		"----------------------------------------\n"+
		"Current Date and Time (UTC): %s\n"+
		"Current User's Login: %s",
		"Hello world", currentTime, userName)
	m.SetBody("text/plain", plainBody)

	// Add attachments if any

	// Create dialer for SMTP connection
	d := mail.NewDialer("smtp.gmail.com", 587, from, mailToken)
	err := d.DialAndSend(m)
	if err != nil {
		fmt.Printf("Failed to send email: %v\n", err)
		// return specific error for retry login
		return fmt.Errorf("failed to send email: %w", err)
	}
	return nil
}
