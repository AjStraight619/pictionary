// package main

// import (
// 	"net/http"

// 	"github.com/Ajstraight619/pictionary-server/internal/db"
// 	g "github.com/Ajstraight619/pictionary-server/internal/game"
// 	h "github.com/Ajstraight619/pictionary-server/internal/handlers"
// 	"github.com/Ajstraight619/pictionary-server/internal/ws"
// 	"github.com/labstack/echo/v4"
// 	"github.com/labstack/echo/v4/middleware"
// )

// func main() {
// 	e := echo.New()
// 	e.Use(middleware.Logger())
// 	e.Use(middleware.Recover())

// 	db.InitDB("data/game.db")

// 	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
// 		AllowOrigins: []string{"http://localhost:5173"},
// 		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodOptions},
// 		AllowHeaders: []string{"Origin", "Content-Type", "Accept"},
// 	}))

// 	hubs := ws.NewHubs()
// 	games := g.NewGames()

// 	h.RegisterRoutes(e, hubs, games)

// 	e.Logger.Fatal(e.Start(":8000"))
// }

package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Ajstraight619/pictionary-server/internal/db"
	"github.com/Ajstraight619/pictionary-server/internal/handlers"
	"github.com/Ajstraight619/pictionary-server/internal/server"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// Initialize the game server
	gameServer := server.NewGameServer()

	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	db.InitDB("data/game.db")

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:5173"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodOptions},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept"},
	}))

	// Register routes with gameServer instead of separate games and hubs
	handlers.RegisterRoutes(e, gameServer)

	// Handle graceful shutdown
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := gameServer.Shutdown(ctx); err != nil {
			e.Logger.Fatal(err)
		}

		if err := e.Shutdown(ctx); err != nil {
			e.Logger.Fatal(err)
		}
	}()

	e.Logger.Fatal(e.Start(":8000"))
}
