package errors

import (
	"fmt"
)

// ErrorClass represents error classification
type ErrorClass string

const (
	// Error classes
	ClassGeneral       ErrorClass = "General"
	ClassHardware      ErrorClass = "Hardware"
	ClassValidator     ErrorClass = "Validator"
	ClassSecurity      ErrorClass = "Security"
	ClassNetwork       ErrorClass = "Network"
	ClassTransaction   ErrorClass = "Transaction"
	ClassWallet        ErrorClass = "Wallet"
	ClassPQC          ErrorClass = "QuantumSafe"  // Post-Quantum Cryptography errors
)

// LocaleKey represents internationalization key
type LocaleKey string

// BaseError is the base error type for Baron Chain
type BaseError struct {
	class   ErrorClass
	code    int
	key     LocaleKey
	message string
	info    map[string]interface{}
	err     error
}

func (e *BaseError) Error() string {
	if e.err != nil {
		return fmt.Sprintf("%s: %v", e.message, e.err)
	}
	return e.message
}

func (e *BaseError) Unwrap() error {
	return e.err
}

func (e *BaseError) Class() ErrorClass {
	return e.class
}

func (e *BaseError) Code() int {
	return e.code
}

func (e *BaseError) LocaleKey() LocaleKey {
	return e.key
}

func (e *BaseError) Info() map[string]interface{} {
	return e.info
}

// Error constructors

// NewInternalError creates a new internal error
func NewInternalError(msg string, err error) *BaseError {
	return &BaseError{
		class:   ClassGeneral,
		code:    -99999,
		key:     "internal_error",
		message: msg,
		err:     err,
	}
}

// NewValidationError creates a new validation error
func NewValidationError(msg string, key LocaleKey, info map[string]interface{}) *BaseError {
	return &BaseError{
		class:   ClassValidator,
		code:    -1000,
		key:     key,
		message: msg,
		info:    info,
	}
}

// New Hardware Errors

// HardwareError represents hardware-related errors
type HardwareError struct {
	*BaseError
	DeviceID  string
	ConnectID string
	Reconnect bool
}

func NewHardwareError(msg string, deviceID, connectID string, reconnect bool) *HardwareError {
	return &HardwareError{
		BaseError: &BaseError{
			class:   ClassHardware,
			code:    -2000,
			key:     "hardware_error",
			message: msg,
		},
		DeviceID:  deviceID,
		ConnectID: connectID,
		Reconnect: reconnect,
	}
}

// PQCError represents quantum cryptography errors
type PQCError struct {
	*BaseError
	Operation string
}

func NewPQCError(msg string, op string) *PQCError {
	return &PQCError{
		BaseError: &BaseError{
			class:   ClassPQC,
			code:    -3000,
			key:     "quantum_crypto_error",
			message: msg,
		},
		Operation: op,
	}
}

// Pre-defined errors
var (
	// Generic errors
	ErrNotImplemented = &BaseError{
		class:   ClassGeneral,
		code:    -1,
		key:     "not_implemented",
		message: "feature not implemented",
	}

	// Wallet errors
	ErrWalletExists = &BaseError{
		class:   ClassWallet,
		code:    -1100,
		key:     "wallet_exists",
		message: "wallet already exists",
	}

	ErrInvalidWalletName = &BaseError{
		class:   ClassWallet,
		code:    -1101,
		key:     "invalid_wallet_name",
		message: "invalid wallet name",
	}

	// Password errors
	ErrWrongPassword = &BaseError{
		class:   ClassSecurity,
		code:    -1200,
		key:     "wrong_password",
		message: "incorrect password",
	}

	ErrWeakPassword = &BaseError{
		class:   ClassSecurity,
		code:    -1201,
		key:     "weak_password",
		message: "password too weak",
	}

	// Quantum-safe errors
	ErrInvalidKyberKey = &BaseError{
		class:   ClassPQC,
		code:    -3001,
		key:     "invalid_kyber_key",
		message: "invalid Kyber key",
	}

	ErrKyberEncryption = &BaseError{
		class:   ClassPQC,
		code:    -3002,
		key:     "kyber_encryption_failed",
		message: "Kyber encryption failed",
	}

	ErrKyberDecryption = &BaseError{
		class:   ClassPQC,
		code:    -3003,
		key:     "kyber_decryption_failed",
		message: "Kyber decryption failed",
	}

	// Transaction errors
	ErrInsufficientFunds = &BaseError{
		class:   ClassTransaction,
		code:    -4000,
		key:     "insufficient_funds",
		message: "insufficient funds",
	}

	ErrInvalidAmount = &BaseError{
		class:   ClassTransaction,
		code:    -4001,
		key:     "invalid_amount",
		message: "invalid transaction amount",
	}

	ErrInvalidAddress = &BaseError{
		class:   ClassTransaction,
		code:    -4002,
		key:     "invalid_address",
		message: "invalid address",
	}

	// Network errors
	ErrNetworkNotSupported = &BaseError{
		class:   ClassNetwork,
		code:    -5000,
		key:     "network_not_supported",
		message: "network not supported",
	}

	ErrNetworkTimeout = &BaseError{
		class:   ClassNetwork,
		code:    -5001,
		key:     "network_timeout",
		message: "network operation timeout",
	}
)

// Error check helpers 
func IsNotImplemented(err error) bool {
	if err == nil {
		return false
	}
	base, ok := err.(*BaseError)
	return ok && base.code == ErrNotImplemented.code
}

func IsHardwareError(err error) bool {
	if err == nil {
		return false
	}
	_, ok := err.(*HardwareError)
	return ok
}

func IsPQCError(err error) bool {
	if err == nil {
		return false
	}
	_, ok := err.(*PQCError)
	return ok
}

// Error with params
func Errorf(err *BaseError, format string, args ...interface{}) *BaseError {
	return &BaseError{
		class:   err.class,
		code:    err.code,
		key:     err.key,
		message: fmt.Sprintf(format, args...),
		info:    err.info,
	}
}

// Wrap error with additional context
func WrapError(err error, msg string) error {
	if err == nil {
		return nil
	}
	return fmt.Errorf("%s: %w", msg, err)
}

// Custom error constructors

func NewInvalidMnemonicError(msg string) *BaseError {
	return &BaseError{
		class:   ClassValidator,
		code:    -1002,
		key:     "invalid_mnemonic",
		message: msg,
	}
}

func NewInsufficientBalanceError(balance, required string) *BaseError {
	return &BaseError{
		class:   ClassTransaction,
		code:    -4003,
		key:     "insufficient_balance",
		message: fmt.Sprintf("insufficient balance: have %s, need %s", balance, required),
		info: map[string]interface{}{
			"balance":  balance,
			"required": required,
		},
	}
}

func NewAccountLimitError(limit int) *BaseError {
	return &BaseError{
		class:   ClassWallet,
		code:    -1102,
		key:     "account_limit",
		message: fmt.Sprintf("account limit reached: %d", limit),
		info: map[string]interface{}{
			"limit": limit,
		},
	}
}
