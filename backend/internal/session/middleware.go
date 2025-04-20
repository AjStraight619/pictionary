package session

import (
	"log"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
)

func Middleware(manager *Manager) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Log request info for debugging
			log.Printf("[DEBUG] Request from Origin: %s, Referer: %s, URL: %s",
				c.Request().Header.Get("Origin"),
				c.Request().Header.Get("Referer"),
				c.Request().URL.Path)

			// Get session ID from cookie
			cookie, err := c.Cookie(CookieName)

			c.Set("session_manager", manager)

			// If cookie doesn't exist or is invalid, continue without session
			if err != nil || cookie.Value == "" {
				log.Printf("[SESSION] No session cookie found for request: %s", c.Request().URL.Path)
				return next(c)
			}

			// Try to get session data from Redis
			sessionID := cookie.Value
			log.Printf("[SESSION] Found cookie with session ID: %s", sessionID)

			sessionData, err := manager.Get(sessionID)

			if err != nil {
				// If session not found, clear the cookie
				if err == ErrSessionNotFound {
					log.Printf("[SESSION] Invalid session ID in Redis: %s", sessionID)
					ClearSessionCookie(c)
				} else {
					log.Printf("[SESSION] Error retrieving session from Redis: %v", err)
				}
				return next(c)
			}

			// Valid session found in Redis, store in context
			log.Printf("[SESSION] Valid session for player: %s (username: %s)",
				sessionData.PlayerID, sessionData.Username)

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
		sessionID, hasSession := c.Get("session_id").(string)
		if !hasSession {
			log.Printf("[AUTH] Authentication failed: No valid session found")
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"error": "Authentication required",
			})
		}

		log.Printf("[AUTH] Authenticated request with session: %s", sessionID)
		return next(c)
	}
}

func SetSessionCookie(c echo.Context, sessionID string) {
	cookie := new(http.Cookie)
	cookie.Name = CookieName
	cookie.Value = sessionID
	cookie.Path = "/"
	cookie.Expires = time.Now().Add(SessionExpiration)
	cookie.HttpOnly = true

	// Use SameSite=None for cross-domain requests
	environment, ok := c.Get("environment").(string)
	if ok && environment == "production" {
		cookie.Secure = true
		cookie.SameSite = http.SameSiteNoneMode
	} else {
		cookie.SameSite = http.SameSiteLaxMode
	}

	c.SetCookie(cookie)
	log.Printf("[SESSION] Set session cookie with ID: %s, Environment: %s, SameSite: %v, Secure: %v",
		sessionID,
		environment,
		cookie.SameSite,
		cookie.Secure)
}

func ClearSessionCookie(c echo.Context) {
	cookie := new(http.Cookie)
	cookie.Name = CookieName
	cookie.Value = ""
	cookie.Path = "/"
	cookie.Expires = time.Unix(0, 0)
	cookie.HttpOnly = true

	// Use same SameSite policy as SetSessionCookie
	environment, ok := c.Get("environment").(string)
	if ok && environment == "production" {
		cookie.Secure = true
		cookie.SameSite = http.SameSiteNoneMode
	} else {
		cookie.SameSite = http.SameSiteLaxMode
	}

	c.SetCookie(cookie)
	log.Printf("[SESSION] Cleared session cookie. Environment: %s, SameSite: %v, Secure: %v",
		environment,
		cookie.SameSite,
		cookie.Secure)
}

func GetSessionManager(c echo.Context) *Manager {
	if v, ok := c.Get("session_manager").(*Manager); ok {
		return v
	}
	return nil
}

func GetSessionData(c echo.Context) *SessionData {
	if v, ok := c.Get("session_data").(*SessionData); ok {
		return v
	}
	return nil
}

func GetSessionID(c echo.Context) string {
	if v, ok := c.Get("session_id").(string); ok {
		return v
	}
	return ""
}
