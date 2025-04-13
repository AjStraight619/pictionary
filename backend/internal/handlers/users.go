package handlers

import (
	"net/http"
	"strconv"

	"github.com/Ajstraight619/pictionary-server/internal/session"
	"github.com/Ajstraight619/pictionary-server/internal/user"
	"github.com/labstack/echo/v4"
)

type UserHandler struct {
	userService *user.Service
}

func NewUserHandler(userService *user.Service) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

func RegisterUserRoutes(e *echo.Echo, userService *user.Service) {
	handler := NewUserHandler(userService)

	// Public user routes
	users := e.Group("/users")
	users.GET("/:id", handler.GetUser)
	users.GET("/:id/stats", handler.GetUserStats)
	users.GET("/search", handler.SearchUsers)

	// Protected user routes
	authUsers := e.Group("/users")
	authUsers.Use(session.RequireAuth)
	authUsers.PUT("/profile", handler.UpdateProfile)
	authUsers.PUT("/password", handler.ChangePassword)
}

func (h *UserHandler) GetUser(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "User ID is required"})
	}

	user, err := h.userService.GetByID(id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "User not found"})
	}

	// Return public user info (exclude sensitive data)
	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":             user.ID,
		"username":       user.Username,
		"gamesPlayed":    user.GamesPlayed,
		"gamesWon":       user.GamesWon,
		"profilePicture": user.ProfilePicture,
	})
}

func (h *UserHandler) GetUserStats(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "User ID is required"})
	}

	user, err := h.userService.GetByID(id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "User not found"})
	}

	// Include win rate calculation
	winRate := 0.0
	if user.GamesPlayed > 0 {
		winRate = float64(user.GamesWon) / float64(user.GamesPlayed) * 100
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":           user.ID,
		"username":     user.Username,
		"gamesPlayed":  user.GamesPlayed,
		"gamesWon":     user.GamesWon,
		"totalScore":   user.TotalScore,
		"highestScore": user.HighestScore,
		"winRate":      winRate,
	})
}

func (h *UserHandler) SearchUsers(c echo.Context) error {
	query := c.QueryParam("q")
	if query == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Search query is required"})
	}

	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit <= 0 {
		limit = 10
	}

	users, err := h.userService.SearchUsers(query, limit)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Error searching users"})
	}

	return c.JSON(http.StatusOK, users)
}

func (h *UserHandler) UpdateProfile(c echo.Context) error {
	// Get user ID from session
	sessionData := session.GetSessionData(c)
	if sessionData == nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Not authenticated"})
	}

	// Parse request body
	var req struct {
		Username       string `json:"username"`
		ProfilePicture string `json:"profilePicture"`
	}

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	// Update profile using service method
	if err := h.userService.UpdateProfile(sessionData.PlayerID, req.Username, req.ProfilePicture); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Profile updated successfully"})
}

func (h *UserHandler) ChangePassword(c echo.Context) error {
	// Get user ID from session
	sessionData := session.GetSessionData(c)
	if sessionData == nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Not authenticated"})
	}

	// Parse request body
	var req struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	// Validate inputs
	if req.CurrentPassword == "" || req.NewPassword == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Both current and new passwords are required"})
	}

	// Change password using service method
	if err := h.userService.ChangePassword(sessionData.PlayerID, req.CurrentPassword, req.NewPassword); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Password changed successfully"})
}
