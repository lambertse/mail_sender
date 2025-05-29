package handler

import (
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/lambertse/cquan_go_webapp/internal/model"
)


type FileHandler struct {
}

func NewFileHandler() *FileHandler {
	handler := FileHandler{}
	return &handler
}

func (h *FileHandler) SaveFile(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form (32MB max)
	var err error
	if err = r.ParseMultipartForm(32 << 20); err != nil {
		log.Printf("Error parsing multipart form: %v", err)
		http.Error(w, "Bad Request: Unable to parse form", http.StatusBadRequest)
		return
	}
	file, _, err := r.FormFile("file")
	if err != nil {
		log.Printf("Error retrieving file from form: %v", err)
		http.Error(w, "Bad Request: Unable to retrieve file", http.StatusBadRequest)
	}
	defer file.Close()

	fileName, err := storeFile(file)
	log.Printf("File name: %s", fileName)
	if err != nil {
		log.Printf("Error storing file: %v", err)
		http.Error(w, "Internal Server Error: Unable to store file", http.StatusInternalServerError)
		return
	}

	receivers, err := model.GetReceiverFromSource(fileName)
	// Docode receiver into JSON and send it back
	if err != nil {
		log.Printf("Error getting receivers from source: %v", err)
		http.Error(w, "Internal Server Error: Unable to process file", http.StatusInternalServerError)
		return
	}
	jsonResponse := model.EncodeReceiversToJSON(receivers)
	log.Printf("JSON Response: %s", jsonResponse)
	// Set the response header to application/json
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, err = w.Write([]byte(jsonResponse))
	if err != nil {
		log.Printf("Error writing response: %v", err)
		http.Error(w, "Internal Server Error: Unable to write response", http.StatusInternalServerError)
		return
	}
}

func storeFile(file multipart.File) (string, error) {
	if err := os.MkdirAll("uploads", os.ModePerm); err != nil {
		return "", fmt.Errorf("Error creating uploads directory: %v", err)
	}

	filename := fmt.Sprintf("%d", time.Now().UnixNano())
	filepath := filepath.Join("uploads", filename)

	// Create destination file
	dst, err := os.Create(filepath)
	if err != nil {
		return "", fmt.Errorf("Error creating file: %v", err)
	}
	defer dst.Close()

	// Copy uploaded file
	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("Error saving file: %v", err)
	}
	return filepath, nil
}

