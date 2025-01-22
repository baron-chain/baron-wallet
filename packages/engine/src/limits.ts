package constants

// Name length constraints
const (
	// WalletNameMinLength defines the minimum length for wallet names
	WalletNameMinLength = 1

	// WalletNameMaxLength defines the maximum length for wallet names
	WalletNameMaxLength = 24

	// AccountNameMinLength defines the minimum length for account names
	AccountNameMinLength = 1

	// AccountNameMaxLength defines the maximum length for account names
	AccountNameMaxLength = 24
)

// Account number limits
const (
	// WatchingAccountMaxNum defines the maximum number of watching accounts
	WatchingAccountMaxNum = 9999

	// ImportedAccountMaxNum defines the maximum number of imported accounts
	ImportedAccountMaxNum = 9999

	// ExternalAccountMaxNum defines the maximum number of external accounts
	ExternalAccountMaxNum = 9999

	// DerivedAccountMaxNum defines the maximum number of derived accounts (2^31)
	DerivedAccountMaxNum = 2147483648
)

// Wallet type limits
const (
	// HDWalletMaxNum defines the maximum number of HD wallets
	HDWalletMaxNum = 100

	// HWWalletMaxNum defines the maximum number of hardware wallets
	HWWalletMaxNum = 100

	// HWPassphraseWalletMaxNum defines the maximum number of hardware wallets with passphrase
	HWPassphraseWalletMaxNum = 20
)

// IsValidWalletName checks if a wallet name meets length requirements
func IsValidWalletName(name string) bool {
	length := len(name)
	return length >= WalletNameMinLength && length <= WalletNameMaxLength
}

// IsValidAccountName checks if an account name meets length requirements
func IsValidAccountName(name string) bool {
	length := len(name)
	return length >= AccountNameMinLength && length <= AccountNameMaxLength
}

// CanAddWatchingAccount checks if another watching account can be added
func CanAddWatchingAccount(currentNum int) bool {
	return currentNum < WatchingAccountMaxNum
}

// CanAddImportedAccount checks if another imported account can be added
func CanAddImportedAccount(currentNum int) bool {
	return currentNum < ImportedAccountMaxNum
}

// CanAddExternalAccount checks if another external account can be added
func CanAddExternalAccount(currentNum int) bool {
	return currentNum < ExternalAccountMaxNum
}

// CanAddDerivedAccount checks if another derived account can be added
func CanAddDerivedAccount(currentNum int) bool {
	return currentNum < DerivedAccountMaxNum
}

// CanAddHDWallet checks if another HD wallet can be added
func CanAddHDWallet(currentNum int) bool {
	return currentNum < HDWalletMaxNum
}

// CanAddHWWallet checks if another hardware wallet can be added
func CanAddHWWallet(currentNum int) bool {
	return currentNum < HWWalletMaxNum
}

// CanAddHWPassphraseWallet checks if another hardware wallet with passphrase can be added
func CanAddHWPassphraseWallet(currentNum int) bool {
	return currentNum < HWPassphraseWalletMaxNum
}

// AccountLimits returns all account-related limits as a map
func AccountLimits() map[string]int {
	return map[string]int{
		"watching":    WatchingAccountMaxNum,
		"imported":    ImportedAccountMaxNum,
		"external":    ExternalAccountMaxNum,
		"derived":     DerivedAccountMaxNum,
		"hdWallet":    HDWalletMaxNum,
		"hwWallet":    HWWalletMaxNum,
		"passphrase": HWPassphraseWalletMaxNum,
	}
}
