package session

import (
	"log"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
)

// Middleware adds session handling to Echo
func Middleware(manager *Manager) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Get session ID from cookie
			cookie, err := c.Cookie(CookieName)

			// Store manager in context for handlers to use
			c.Set("session_manager", manager)

			// If cookie doesn't exist or is invalid, continue without session
			if err != nil || cookie.Value == "" {
				log.Printf("No session cookie found for request: %s", c.Request().URL.Path)
				return next(c)
			}

			// Try to get session data
			sessionID := cookie.Value
			sessionData, err := manager.Get(sessionID)

			if err != nil {
				// If session not found, clear the cookie
				if err == ErrSessionNotFound {
					log.Printf("Invalid session ID: %s", sessionID)
					clearSessionCookie(c)
				} else {
					log.Printf("Error retrieving session: %v", err)
				}
				return next(c)
			}

			// Valid session, store in context
			c.Set("session_id", sessionID)
			c.Set("session_data", sessionData)

			// Call the next handler
			return next(c)
		}
	}
}

// RequireAuth is middleware that requires a valid session
func RequireAuth(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Check if session exists
		if _, ok := c.Get("session_id").(string); !ok {
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"error": "Authentication required",
			})
		}
		return next(c)
	}
}

// SetSessionCookie sets the session cookie
func SetSessionCookie(c echo.Context, sessionID string) {
	cookie := new(http.Cookie)
	cookie.Name = CookieName
	cookie.Value = sessionID
	cookie.Path = "/"
	cookie.Expires = time.Now().Add(SessionExpiration)
	cookie.HttpOnly = true
	cookie.SameSite = http.SameSiteStrictMode
	// In production, set Secure: true
	c.SetCookie(cookie)
}

// clearSessionCookie clears the session cookie
func clearSessionCookie(c echo.Context) {
	cookie := new(http.Cookie)
	cookie.Name = CookieName
	cookie.Value = ""
	cookie.Path = "/"
	cookie.Expires = time.Unix(0, 0)
	cookie.HttpOnly = true
	cookie.SameSite = http.SameSiteStrictMode
	c.SetCookie(cookie)
}

// GetSessionManager gets the session manager from context
func GetSessionManager(c echo.Context) *Manager {
	if v, ok := c.Get("session_manager").(*Manager); ok {
		return v
	}
	return nil
}

// GetSessionData gets session data from context
func GetSessionData(c echo.Context) *SessionData {
	if v, ok := c.Get("session_data").(*SessionData); ok {
		return v
	}
	return nil
}

// GetSessionID gets session ID from context
func GetSessionID(c echo.Context) string {
	if v, ok := c.Get("session_id").(string); ok {
		return v
	}
	return ""
}
