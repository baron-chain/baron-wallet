package engine

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/baron-chain/baron-wallet/crypto/kyber"
	"github.com/baron-chain/baron-wallet/db"
	"github.com/baron-chain/baron-wallet/provider"
	"github.com/baron-chain/baron-wallet/types"
	"github.com/baron-chain/baron-wallet/vault"
	"github.com/cometbft/cometbft/crypto/ed25519"
)

var (
	// ErrNetworkNotFound represents a network not found error
	ErrNetworkNotFound = errors.New("network not found")
	
	// ErrAccountNotFound represents an account not found error
	ErrAccountNotFound = errors.New("account not found")
	
	// ErrWalletNotFound represents a wallet not found error
	ErrWalletNotFound = errors.New("wallet not found")
	
	// ErrInvalidPassword represents an invalid password error
	ErrInvalidPassword = errors.New("invalid password")
)

// Engine represents the core wallet engine
type Engine struct {
	mu              sync.RWMutex
	dbAPI           db.API
	providerManager *provider.Manager
	vaultFactory    *vault.Factory
	kyberManager    *kyber.Manager
	
	// Cache for vaults to avoid recreation
	vaultCache      sync.Map  // map[string]*vault.Vault
	networkCache    sync.Map  // map[string]*types.Network
}

// NewEngine creates a new instance of the wallet engine
func NewEngine(ctx context.Context, opt *types.EngineOptions) (*Engine, error) {
	if opt == nil {
		opt = &types.EngineOptions{}
	}

	dbAPI, err := db.NewAPI(ctx, opt.DBOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize database: %w", err)
	}

	providerManager, err := provider.NewManager(ctx, opt.ProviderOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize provider manager: %w", err)
	}

	vaultFactory := vault.NewFactory(&vault.FactoryOptions{
		DBApi:     dbAPI,
		Provider:  providerManager,
		Networks:  opt.Networks,
		CacheTTL: opt.VaultCacheTTL,
	})

	kyberManager := kyber.NewManager()

	engine := &Engine{
		dbAPI:           dbAPI,
		providerManager: providerManager,
		vaultFactory:    vaultFactory,
		kyberManager:    kyberManager,
	}

	return engine, nil
}

// Close gracefully shuts down the engine
func (e *Engine) Close() error {
	e.mu.Lock()
	defer e.mu.Unlock()

	if err := e.dbAPI.Close(); err != nil {
		return fmt.Errorf("failed to close database: %w", err)
	}

	if err := e.providerManager.Close(); err != nil {
		return fmt.Errorf("failed to close provider manager: %w", err)
	}

	e.vaultCache.Range(func(key, value interface{}) bool {
		if v, ok := value.(*vault.Vault); ok {
			if err := v.Close(); err != nil {
				// just log error but continue closing others
				fmt.Printf("failed to close vault: %v\n", err)
			}
		}
		return true
	})

	return nil
}

// GetOrCreateVault returns an existing vault or creates a new one
func (e *Engine) GetOrCreateVault(ctx context.Context, networkID string, accountID string) (*vault.Vault, error) {
	cacheKey := fmt.Sprintf("%s-%s", networkID, accountID)
	
	// Try to get from cache first
	if cached, ok := e.vaultCache.Load(cacheKey); ok {
		if v, ok := cached.(*vault.Vault); ok {
			return v, nil
		}
	}

	e.mu.Lock()
	defer e.mu.Unlock()

	// Check cache again after acquiring lock
	if cached, ok := e.vaultCache.Load(cacheKey); ok {
		if v, ok := cached.(*vault.Vault); ok {
			return v, nil
		}
	}

	network, err := e.getNetwork(ctx, networkID)
	if err != nil {
		return nil, err
	}

	v, err := e.vaultFactory.CreateVault(ctx, network, accountID)
	if err != nil {
		return nil, fmt.Errorf("failed to create vault: %w", err)
	}

	e.vaultCache.Store(cacheKey, v)
	return v, nil
}

// getNetwork returns network information by ID
func (e *Engine) getNetwork(ctx context.Context, networkID string) (*types.Network, error) {
	// Try cache first
	if cached, ok := e.networkCache.Load(networkID); ok {
		if n, ok := cached.(*types.Network); ok {
			return n, nil
		}
	}

	network, err := e.dbAPI.GetNetwork(ctx, networkID)
	if err != nil {
		return nil, fmt.Errorf("failed to get network: %w", err)
	}

	e.networkCache.Store(networkID, network)
	return network, nil
}

// ClearCache clears all internal caches
func (e *Engine) ClearCache() {
	e.mu.Lock()
	defer e.mu.Unlock()

	e.vaultCache = sync.Map{}
	e.networkCache = sync.Map{}
}

// ValidatePassword validates if the provided password is correct
func (e *Engine) ValidatePassword(ctx context.Context, password string) error {
	if err := e.dbAPI.ValidatePassword(ctx, password); err != nil {
		return ErrInvalidPassword
	}
	return nil
}

// ChangePassword changes the master password
func (e *Engine) ChangePassword(ctx context.Context, oldPassword, newPassword string) error {
	if err := e.ValidatePassword(ctx, oldPassword); err != nil {
		return err
	}

	return e.dbAPI.UpdatePassword(ctx, oldPassword, newPassword)
}

// ResetWallet resets the entire wallet state
func (e *Engine) ResetWallet(ctx context.Context) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	if err := e.dbAPI.Reset(ctx); err != nil {
		return fmt.Errorf("failed to reset database: %w", err)
	}

	e.ClearCache()
	return nil
}

// GetFeatureFlags returns the current feature flags
func (e *Engine) GetFeatureFlags(ctx context.Context) (*types.FeatureFlags, error) {
	return e.dbAPI.GetFeatureFlags(ctx)
}

// UpdateFeatureFlags updates the feature flags
func (e *Engine) UpdateFeatureFlags(ctx context.Context, flags *types.FeatureFlags) error {
	return e.dbAPI.UpdateFeatureFlags(ctx, flags)
}

// GetAppSettings returns the current app settings
func (e *Engine) GetAppSettings(ctx context.Context) (*types.AppSettings, error) {
	return e.dbAPI.GetAppSettings(ctx)
}

// UpdateAppSettings updates the app settings
func (e *Engine) UpdateAppSettings(ctx context.Context, settings *types.AppSettings) error {
	return e.dbAPI.UpdateAppSettings(ctx, settings)
}
