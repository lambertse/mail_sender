package handlers

import (
	"encoding/json"
	"net/http"
	"time"
    "fmt"
    "os"
    "strings"

	"github.com/golang-jwt/jwt/v4"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string      `json:"token"`
	User  interface{} `json:"user"`
}

type User struct {
	Username string `json:"username"`
    MailToken string `json:"mail_token"`
	ID       int    `json:"id,omitempty"`
}

// JWT claims structure
type Claims struct {
	Username string `json:"username"`
    MailToken string `json:"mail_token"`
	jwt.RegisteredClaims
}

// JWT secret key get from .env


func LoginHandler(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	// Handle preflight request
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var loginReq LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&loginReq); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
    fmt.Printf("Login user: %s, pass: %s\n", loginReq.Username, loginReq.Password)

	// Validate credentials
	if !validateCredentials(loginReq.Username, loginReq.Password) {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	// Generate JWT token
	token, err := generateJWT(loginReq.Username, loginReq.Password)
	if err != nil {
        fmt.Printf("Error generating token: %v\n", err)
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Create response
	response := LoginResponse{
		Token: token,
		User: User{
			Username: loginReq.Username,
            MailToken: loginReq.Password,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func validateCredentials(username, password string) bool {
    return true	
}

func generateJWT(username, mailtoken string) (string, error) {
    var jwtKey = os.Getenv("JWT_SECRET_KEY")
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		Username: username,
        MailToken: mailtoken,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "mail-sender-app",
		},
	}
    fmt.Printf("JWT Key: %s\n", jwtKey)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtKey))
}

func ExtractClaimsFromToken(tokenString string) (*Claims, error) {
	var jwtKey = os.Getenv("JWT_SECRET_KEY")
	
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(jwtKey), nil
	})
	
	if err != nil {
		return nil, err
	}
	
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	
	return nil, fmt.Errorf("invalid token")
}

func GetUserFromRequest(r *http.Request) (*Claims, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return nil, fmt.Errorf("authorization header missing")
	}
	
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	return ExtractClaimsFromToken(tokenString)
}

