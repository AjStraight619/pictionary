package app

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Ajstraight619/pictionary-server/internal/server"
	"github.com/labstack/echo/v4"
)

func SetupShutdown(e *echo.Echo, gameServer *server.GameServer) {
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
}
