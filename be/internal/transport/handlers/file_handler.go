package handlers

import (
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"

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
    // Store into /tmp/template-file.xlsx
    // tempDir := os.TempDir() 
    tempDir := "/tmp/"
    filePath := filepath.Join(tempDir, "template-file.xlsx")
    outFile, err := os.Create(filePath)
    if err != nil {
        return "", fmt.Errorf("failed to create file: %v", err)
    }
    defer outFile.Close()

    _, err = io.Copy(outFile, file)
    if err != nil {
        return "", fmt.Errorf("failed to save file: %v", err)
    }
    return filePath, nil
}

