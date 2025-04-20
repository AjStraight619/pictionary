// backend/internal/handlers/auth.go
package handlers

import (
	"net/http"

	"log"

	"github.com/Ajstraight619/pictionary-server/internal/db"
	"github.com/Ajstraight619/pictionary-server/internal/session"
	"github.com/labstack/echo/v4"
)

type UserService interface {
	Create(email, username, password string) (*db.User, error)
	Authenticate(email, password string) (*db.User, error)
	GetByID(id string) (*db.User, error)
}

type AuthHandler struct {
	userService UserService
}

func NewAuthHandler(userService UserService) *AuthHandler {
	return &AuthHandler{
		userService: userService,
	}
}

func RegisterAuthRoutes(e *echo.Echo, userService UserService) {
	handler := NewAuthHandler(userService)

	// Public routes
	e.POST("/auth/register", handler.Register)
	e.POST("/auth/login", handler.Login)

	// Protected routes - require authentication
	auth := e.Group("/auth")
	auth.Use(session.RequireAuth)
	auth.GET("/profile", handler.GetProfile)
	auth.POST("/logout", handler.Logout)
}

func (h *AuthHandler) Register(c echo.Context) error {
	var req struct {
		Email    string `json:"email"`
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	// Validate inputs
	if req.Email == "" || req.Username == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "All fields required"})
	}

	// Create user
	user, err := h.userService.Create(req.Email, req.Username, req.Password)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	// Create session for the new user
	sessionMgr := session.GetSessionManager(c)
	if sessionMgr != nil {
		sessionID, _ := sessionMgr.Create(user.ID, user.Username)
		session.SetSessionCookie(c, sessionID)
	}

	return c.JSON(http.StatusCreated, map[string]string{
		"id":       user.ID,
		"username": user.Username,
	})
}

func (h *AuthHandler) Login(c echo.Context) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.Bind(&req); err != nil {
		log.Printf("[AUTH] Login failed: Invalid request format: %v", err)
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	// Validate inputs
	if req.Email == "" || req.Password == "" {
		log.Printf("[AUTH] Login failed: Missing email or password")
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Email and password required"})
	}

	log.Printf("[AUTH] Login attempt for email: %s", req.Email)

	// Authenticate user
	user, err := h.userService.Authenticate(req.Email, req.Password)
	if err != nil {
		log.Printf("[AUTH] Login failed for %s: %v", req.Email, err)
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid email or password"})
	}

	// Create session
	sessionMgr := session.GetSessionManager(c)
	if sessionMgr != nil {
		sessionID, err := sessionMgr.Create(user.ID, user.Username)
		if err != nil {
			log.Printf("[AUTH] Failed to create session: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Session creation failed"})
		}

		log.Printf("[AUTH] Login successful for %s (ID: %s). Setting cookie with session ID: %s",
			user.Username, user.ID, sessionID)

		// Log request details for debugging
		log.Printf("[DEBUG] Login request headers - Origin: %s, Host: %s, User-Agent: %s",
			c.Request().Header.Get("Origin"),
			c.Request().Header.Get("Host"),
			c.Request().Header.Get("User-Agent"))

		session.SetSessionCookie(c, sessionID)
	} else {
		log.Printf("[AUTH] Warning: Session manager is nil, cannot create session")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"id":       user.ID,
		"username": user.Username,
	})
}

func (h *AuthHandler) GetProfile(c echo.Context) error {
	// Get user ID from session
	sessionData := session.GetSessionData(c)
	if sessionData == nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Not authenticated"})
	}

	// Get user from database
	user, err := h.userService.GetByID(sessionData.PlayerID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "User not found"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":             user.ID,
		"username":       user.Username,
		"email":          user.Email,
		"gamesPlayed":    user.GamesPlayed,
		"gamesWon":       user.GamesWon,
		"totalScore":     user.TotalScore,
		"highestScore":   user.HighestScore,
		"profilePicture": user.ProfilePicture,
	})
}

func (h *AuthHandler) Logout(c echo.Context) error {
	sessionID := session.GetSessionID(c)
	if sessionID == "" {
		return c.JSON(http.StatusOK, map[string]string{"message": "Already logged out"})
	}

	// Delete session
	sessionMgr := session.GetSessionManager(c)
	if sessionMgr != nil {
		sessionMgr.Delete(sessionID)
	}

	// Clear cookie
	session.ClearSessionCookie(c)

	return c.JSON(http.StatusOK, map[string]string{"message": "Logged out successfully"})
}
