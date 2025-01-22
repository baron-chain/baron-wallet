package engine

import (
	"context"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"

	"github.com/baron-chain/baron-wallet/crypto/kyber"
	"github.com/baron-chain/baron-wallet/types"
	"github.com/cometbft/cometbft/crypto/ed25519"
)

var (
	// ErrInvalidMnemonic represents an invalid mnemonic error
	ErrInvalidMnemonic = errors.New("invalid mnemonic")

	// ErrInvalidAccountName represents an invalid account name error
	ErrInvalidAccountName = errors.New("invalid account name")

	// ErrAccountExists represents a duplicate account error
	ErrAccountExists = errors.New("account already exists")

	// ErrInvalidNetworkID represents an invalid network ID error
	ErrInvalidNetworkID = errors.New("invalid network ID")
)

// CreateHDWallet creates a new HD wallet with the given options
func (e *Engine) CreateHDWallet(ctx context.Context, opts *types.CreateWalletOptions) (*types.Wallet, error) {
	if err := e.ValidatePassword(ctx, opts.Password); err != nil {
		return nil, err
	}

	if err := e.validateAccountName(opts.Name); err != nil {
		return nil, err
	}

	if err := e.validateMnemonic(opts.Mnemonic); err != nil {
		return nil, err
	}

	// Generate entropy and seed using Kyber 
	entropy, seed, err := e.kyberManager.GenerateEntropyAndSeed(opts.Password, opts.Mnemonic)
	if err != nil {
		return nil, fmt.Errorf("failed to generate entropy and seed: %w", err)
	}

	// Create wallet in database
	wallet, err := e.dbAPI.CreateHDWallet(ctx, &types.CreateHDWalletParams{
		Name:      opts.Name,
		Password:  opts.Password,
		Entropy:   entropy,
		Seed:      seed,
		Mnemonic:  opts.Mnemonic,
		Avatar:    opts.Avatar,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create wallet: %w", err)
	}

	// Add default accounts if specified
	if opts.AddDefaultAccounts {
		if err := e.addDefaultAccounts(ctx, wallet.ID, opts.Password); err != nil {
			// Attempt to clean up on failure
			_ = e.dbAPI.DeleteWallet(ctx, wallet.ID)
			return nil, fmt.Errorf("failed to add default accounts: %w", err)
		}
	}

	return wallet, nil
}

// AddAccount adds a new account to a wallet
func (e *Engine) AddAccount(ctx context.Context, opts *types.AddAccountOptions) (*types.Account, error) {
	wallet, err := e.GetWallet(ctx, opts.WalletID)
	if err != nil {
		return nil, err
	}

	if err := e.ValidatePassword(ctx, opts.Password); err != nil {
		return nil, err
	}

	if err := e.validateAccountName(opts.Name); err != nil {
		return nil, err
	}

	network, err := e.getNetwork(ctx, opts.NetworkID)
	if err != nil {
		return nil, err
	}

	vault, err := e.GetOrCreateVault(ctx, opts.NetworkID, wallet.ID)
	if err != nil {
		return nil, err
	}

	// Generate account using vault
	accountParams := &types.CreateAccountParams{
		Name:     opts.Name,
		Path:     opts.Path,
		Template: opts.Template,
		CoinType: network.CoinType,
	}

	account, err := vault.CreateAccount(ctx, accountParams)
	if err != nil {
		return nil, fmt.Errorf("failed to create account: %w", err)
	}

	// Add account to database
	if err := e.dbAPI.AddAccount(ctx, wallet.ID, account); err != nil {
		return nil, fmt.Errorf("failed to add account to database: %w", err)
	}

	return account, nil
}

// GetAccounts returns accounts for a given wallet and network
func (e *Engine) GetAccounts(ctx context.Context, walletID string, networkID string) ([]*types.Account, error) {
	accounts, err := e.dbAPI.GetAccounts(ctx, walletID, networkID)
	if err != nil {
		return nil, fmt.Errorf("failed to get accounts: %w", err)
	}

	return accounts, nil
}

// GetAccount returns a specific account by ID
func (e *Engine) GetAccount(ctx context.Context, accountID string) (*types.Account, error) {
	account, err := e.dbAPI.GetAccount(ctx, accountID)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %w", err)
	}

	return account, nil
}

// DeleteAccount removes an account
func (e *Engine) DeleteAccount(ctx context.Context, opts *types.DeleteAccountOptions) error {
	if err := e.ValidatePassword(ctx, opts.Password); err != nil {
		return err
	}

	account, err := e.GetAccount(ctx, opts.AccountID)
	if err != nil {
		return err
	}

	vault, err := e.GetOrCreateVault(ctx, account.NetworkID, account.WalletID)
	if err != nil {
		return err
	}

	// Clean up account data in vault
	if err := vault.DeleteAccount(ctx, account); err != nil {
		return fmt.Errorf("failed to delete account from vault: %w", err)
	}

	// Remove from database
	if err := e.dbAPI.DeleteAccount(ctx, opts.AccountID); err != nil {
		return fmt.Errorf("failed to delete account from database: %w", err)
	}

	return nil
}

// GetBalance returns the balance for an account
func (e *Engine) GetBalance(ctx context.Context, accountID string, contractAddress string) (*big.Int, error) {
	account, err := e.GetAccount(ctx, accountID)
	if err != nil {
		return nil, err
	}

	vault, err := e.GetOrCreateVault(ctx, account.NetworkID, account.WalletID)
	if err != nil {
		return nil, err
	}

	balance, err := vault.GetBalance(ctx, account.Address, contractAddress)
	if err != nil {
		return nil, fmt.Errorf("failed to get balance: %w", err)
	}

	return balance, nil
}

// SendTransaction sends a transaction
func (e *Engine) SendTransaction(ctx context.Context, opts *types.SendTxOptions) (*types.Transaction, error) {
	if err := e.ValidatePassword(ctx, opts.Password); err != nil {
		return nil, err
	}

	account, err := e.GetAccount(ctx, opts.AccountID)
	if err != nil {
		return nil, err
	}

	vault, err := e.GetOrCreateVault(ctx, account.NetworkID, account.WalletID)
	if err != nil {
		return nil, err
	}

	tx, err := vault.SendTransaction(ctx, opts)
	if err != nil {
		return nil, fmt.Errorf("failed to send transaction: %w", err)
	}

	return tx, nil
}

// Helper functions

func (e *Engine) validateAccountName(name string) error {
	if len(name) < 1 || len(name) > 24 {
		return ErrInvalidAccountName
	}
	return nil
}

func (e *Engine) validateMnemonic(mnemonic string) error {
	if !e.kyberManager.ValidateMnemonic(mnemonic) {
		return ErrInvalidMnemonic
	}
	return nil
}

func (e *Engine) addDefaultAccounts(ctx context.Context, walletID string, password string) error {
	networks, err := e.dbAPI.GetNetworks(ctx)
	if err != nil {
		return err
	}

	for _, network := range networks {
		if !network.IsDefault {
			continue
		}

		opts := &types.AddAccountOptions{
			WalletID:  walletID,
			NetworkID: network.ID,
			Password:  password,
			Name:      fmt.Sprintf("%s Account", network.Name),
		}

		if _, err := e.AddAccount(ctx, opts); err != nil {
			return err
		}
	}

	return nil
}
