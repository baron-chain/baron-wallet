package provider

import (
	"context"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"sync"

	"github.com/baron-chain/baron-wallet/client"
	"github.com/baron-chain/baron-wallet/crypto/kyber"
	"github.com/baron-chain/baron-wallet/types"
	"github.com/cometbft/cometbft/crypto/ed25519"
	"github.com/cometbft/cometbft/crypto/secp256k1"
	sdk "github.com/cosmos/cosmos-sdk/types"
)

var (
	// ErrProviderNotFound represents a provider initialization error
	ErrProviderNotFound = errors.New("provider not found")
	
	// ErrClientInitFailed represents a client initialization error
	ErrClientInitFailed = errors.New("unable to initialize client")
	
	// ErrInvalidCurve represents an unsupported curve error
	ErrInvalidCurve = errors.New("unsupported curve type")
)

// SupportedCurves defines the cryptographic curves supported by Baron Wallet
const (
	CurveSecp256k1 = "secp256k1"
	CurveEd25519   = "ed25519"
	CurveKyber1024 = "kyber1024"  // Post-quantum curve
)

// NetworkConfig represents network-specific configuration
type NetworkConfig struct {
	ImplName      string
	DefaultClient string
	ChainID       string
	CurveType     string
	RPCEndpoints  []string
}

// ProviderController manages blockchain providers and clients
type ProviderController struct {
	mu        sync.RWMutex
	clients   map[string]client.Client
	providers map[string]Provider
	networks  map[string]NetworkConfig
}

// NewProviderController creates a new instance of ProviderController
func NewProviderController() *ProviderController {
	return &ProviderController{
		clients:   make(map[string]client.Client),
		providers: make(map[string]Provider),
		networks:  make(map[string]NetworkConfig),
	}
}

// Provider interface defines methods that must be implemented by blockchain providers
type Provider interface {
	GetNetwork() NetworkConfig
	GetClient() client.Client
	BuildTransaction(ctx context.Context, tx *types.UnsignedTx) (*types.UnsignedTx, error)
	BroadcastTransaction(ctx context.Context, signedTx []byte) (string, error)
	GetBalance(ctx context.Context, address string) (*big.Int, error)
}

// RegisterNetwork registers a new network configuration
func (pc *ProviderController) RegisterNetwork(networkID string, config NetworkConfig) {
	pc.mu.Lock()
	defer pc.mu.Unlock()
	pc.networks[networkID] = config
}

// GetProvider returns a provider for the specified network
func (pc *ProviderController) GetProvider(ctx context.Context, networkID string) (Provider, error) {
	pc.mu.RLock()
	if provider, exists := pc.providers[networkID]; exists {
		pc.mu.RUnlock()
		return provider, nil
	}
	pc.mu.RUnlock()

	pc.mu.Lock()
	defer pc.mu.Unlock()

	config, exists := pc.networks[networkID]
	if !exists {
		return nil, fmt.Errorf("%w: network %s not registered", ErrProviderNotFound, networkID)
	}

	// Initialize client and provider
	client, err := pc.initializeClient(ctx, networkID, config)
	if err != nil {
		return nil, err
	}

	provider, err := pc.initializeProvider(networkID, client, config)
	if err != nil {
		return nil, err
	}

	pc.providers[networkID] = provider
	return provider, nil
}

// Create a new verifier for the specified network and public key
func (pc *ProviderController) GetVerifier(networkID string, publicKey []byte) (*types.Verifier, error) {
	config, exists := pc.networks[networkID]
	if !exists {
		return nil, fmt.Errorf("%w: network %s not registered", ErrProviderNotFound, networkID)
	}

	switch config.CurveType {
	case CurveSecp256k1:
		return types.NewSecp256k1Verifier(publicKey)
	case CurveEd25519:
		return types.NewEd25519Verifier(publicKey)
	case CurveKyber1024:
		return types.NewKyberVerifier(publicKey)
	default:
		return nil, fmt.Errorf("%w: %s", ErrInvalidCurve, config.CurveType)
	}
}

// BuildUnsignedTx builds an unsigned transaction
func (pc *ProviderController) BuildUnsignedTx(ctx context.Context, networkID string, tx *types.UnsignedTx) (*types.UnsignedTx, error) {
	provider, err := pc.GetProvider(ctx, networkID)
	if err != nil {
		return nil, err
	}
	return provider.BuildTransaction(ctx, tx)
}

// BroadcastTransaction broadcasts a signed transaction
func (pc *ProviderController) BroadcastTransaction(ctx context.Context, networkID string, signedTx []byte) (string, error) {
	provider, err := pc.GetProvider(ctx, networkID)
	if err != nil {
		return "", err
	}
	return provider.BroadcastTransaction(ctx, signedTx)
}

// Private helper methods

func (pc *ProviderController) initializeClient(ctx context.Context, networkID string, config NetworkConfig) (client.Client, error) {
	if len(config.RPCEndpoints) == 0 {
		return nil, fmt.Errorf("no RPC endpoints configured for network %s", networkID)
	}

	// First, check if we have an existing client
	if existingClient, exists := pc.clients[networkID]; exists {
		return existingClient, nil
	}

	// Create a new client based on network configuration
	var newClient client.Client
	var err error

	switch config.ImplName {
	case "baron":
		newClient, err = client.NewBaronClient(config.RPCEndpoints[0], config.ChainID)
	case "eth":
		newClient, err = client.NewEVMClient(config.RPCEndpoints[0])
	default:
		return nil, fmt.Errorf("unsupported implementation: %s", config.ImplName)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to initialize client: %w", err)
	}

	pc.clients[networkID] = newClient
	return newClient, nil
}

func (pc *ProviderController) initializeProvider(networkID string, client client.Client, config NetworkConfig) (Provider, error) {
	var provider Provider
	var err error

	switch config.ImplName {
	case "baron":
		provider, err = NewBaronProvider(client, config)
	case "eth":
		provider, err = NewEVMProvider(client, config)
	default:
		return nil, fmt.Errorf("unsupported implementation: %s", config.ImplName)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to initialize provider: %w", err)
	}

	return provider, nil
}

// GetChainInfo returns the chain information for a given network
func (pc *ProviderController) GetChainInfo(networkID string) (types.ChainInfo, error) {
	config, exists := pc.networks[networkID]
	if !exists {
		return types.ChainInfo{}, fmt.Errorf("%w: network %s not registered", ErrProviderNotFound, networkID)
	}

	return types.ChainInfo{
		NetworkID:     networkID,
		ChainID:       config.ChainID,
		Implementation: config.ImplName,
		CurveType:     config.CurveType,
		RPCEndpoints:  config.RPCEndpoints,
	}, nil
}

// GetBalance returns the balance for a given address
func (pc *ProviderController) GetBalance(ctx context.Context, networkID, address string) (*big.Int, error) {
	provider, err := pc.GetProvider(ctx, networkID)
	if err != nil {
		return nil, err
	}
	return provider.GetBalance(ctx, address)
}

// HandleRPCError processes RPC errors and returns appropriate error types
func HandleRPCError(err error) error {
	if err == nil {
		return nil
	}

	switch e := err.(type) {
	case *sdk.Error:
		return &types.RPCError{
			Code:    e.Code(),
			Message: e.Error(),
			Data:    e.Data(),
		}
	default:
		return &types.RPCError{
			Code:    -32603,
			Message: err.Error(),
		}
	}
}
