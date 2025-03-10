package main

import (
	"net/http"

	"github.com/Ajstraight619/pictionary-server/internal/db"
	g "github.com/Ajstraight619/pictionary-server/internal/game"
	h "github.com/Ajstraight619/pictionary-server/internal/handlers"
	"github.com/Ajstraight619/pictionary-server/internal/ws"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	db.InitDB("data/game.db")

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:5173"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodOptions},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept"},
	}))

	hubs := ws.NewHubs()
	games := g.NewGames()

	h.RegisterRoutes(e, hubs, games)

	e.Logger.Fatal(e.Start(":8000"))
}
