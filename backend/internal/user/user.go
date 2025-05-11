package user

import (
	"errors"
	"log"
	"time"

	"github.com/Ajstraight619/pictionary-server/internal/db"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type Service struct {
	db     *gorm.DB
	logger *zap.Logger
}

func NewService(logger *zap.Logger) *Service {
	if db.DB == nil {
		// use the injected logger instead of log.Println
		logger.Warn("Attempting to service with nil database connection")
		return &Service{
			db:     nil,
			logger: logger,
		}
	}

	return &Service{
		db:     db.DB,
		logger: logger,
	}
}

// Authenticate verifies a user's credentials and returns the user if valid
func (s *Service) Authenticate(email, password string) (*db.User, error) {
	if s.db == nil {
		log.Println("ERROR: Cannot authenticate user - database connection is nil")
		return nil, errors.New("database connection error")
	}

	var user db.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid email or password")
		}
		log.Printf("Error retrieving user: %v", err)
		return nil, err
	}

	// Compare password with hash
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	return &user, nil
}

// GetByID retrieves a user by ID
func (s *Service) GetByID(id string) (*db.User, error) {
	if s.db == nil {
		log.Println("ERROR: Cannot get user - database connection is nil")
		return nil, errors.New("database connection error")
	}

	var user db.User
	if err := s.db.Where("id = ?", id).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		log.Printf("Error retrieving user: %v", err)
		return nil, err
	}
	return &user, nil
}

// GetByEmail retrieves a user by email
func (s *Service) GetByEmail(email string) (*db.User, error) {
	var user db.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		log.Printf("Error retrieving user: %v", err)
		return nil, err
	}
	return &user, nil
}

// GetByUsername retrieves a user by username
func (s *Service) GetByUsername(username string) (*db.User, error) {
	var user db.User
	if err := s.db.Where("username = ?", username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		log.Printf("Error retrieving user: %v", err)
		return nil, err
	}
	return &user, nil
}

// Create creates a new user
func (s *Service) Create(email, username, password string) (*db.User, error) {
	// Check if email already exists
	if count := s.db.Where("email = ?", email).Limit(1).Find(&db.User{}).RowsAffected; count > 0 {
		return nil, errors.New("email already in use")
	}

	// Check if username already exists
	if count := s.db.Where("username = ?", username).Limit(1).Find(&db.User{}).RowsAffected; count > 0 {
		return nil, errors.New("username already in use")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		return nil, errors.New("error creating user")
	}

	// Create user
	user := db.User{
		ID:           uuid.New().String(),
		Email:        email,
		Username:     username,
		PasswordHash: string(hashedPassword),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.db.Create(&user).Error; err != nil {
		log.Printf("Error creating user: %v", err)
		return nil, errors.New("error creating user")
	}

	return &user, nil
}

// UpdateProfile updates a user's profile information
func (s *Service) UpdateProfile(id string, username string, profilePicture string) error {
	updates := map[string]interface{}{
		"updated_at": time.Now(),
	}

	if username != "" {
		// Check if username already exists for a different user
		if count := s.db.Where("username = ? AND id != ?", username, id).Limit(1).Find(&db.User{}).RowsAffected; count > 0 {
			return errors.New("username already in use")
		}
		updates["username"] = username
	}

	if profilePicture != "" {
		updates["profile_picture"] = profilePicture
	}

	if err := s.db.Model(&db.User{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		log.Printf("Error updating user: %v", err)
		return errors.New("error updating user")
	}

	return nil
}

// ChangePassword changes a user's password
func (s *Service) ChangePassword(id, currentPassword, newPassword string) error {
	var user db.User
	if err := s.db.Where("id = ?", id).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
		log.Printf("Error retrieving user: %v", err)
		return errors.New("error changing password")
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(currentPassword)); err != nil {
		return errors.New("current password is incorrect")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		return errors.New("error changing password")
	}

	// Update password
	if err := s.db.Model(&user).Updates(map[string]interface{}{
		"password_hash": hashedPassword,
		"updated_at":    time.Now(),
	}).Error; err != nil {
		log.Printf("Error updating password: %v", err)
		return errors.New("error changing password")
	}

	return nil
}

// GetUserGames gets games a user has participated in
func (s *Service) GetUserGames(userID string, limit, offset int) ([]db.Game, error) {
	if limit <= 0 {
		limit = 10
	}

	var games []db.Game
	err := s.db.Joins("JOIN game_participations ON games.id = game_participations.game_id").
		Where("game_participations.user_id = ?", userID).
		Order("games.created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&games).Error

	if err != nil {
		log.Printf("Error getting user games: %v", err)
		return nil, err
	}

	return games, nil
}

// SearchUsers searches for users by username
func (s *Service) SearchUsers(query string, limit int) ([]db.User, error) {
	if limit <= 0 {
		limit = 10
	}

	var users []db.User
	if err := s.db.Where("username LIKE ?", "%"+query+"%").
		Limit(limit).
		Find(&users).Error; err != nil {
		log.Printf("Error searching users: %v", err)
		return nil, err
	}

	return users, nil
}
