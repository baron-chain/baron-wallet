package utils

import (
	"errors"
	"math/big"

	"github.com/baron-chain/baron-wallet/types"
	"github.com/baron-chain/baron-wallet/crypto/kyber"
	sdk "github.com/cosmos/cosmos-sdk/types"
)

var (
	// ErrInvalidAmount represents an error for invalid transaction amount
	ErrInvalidAmount = errors.New("invalid transaction amount")
	
	// ErrInvalidAddress represents an error for invalid address format
	ErrInvalidAddress = errors.New("invalid address format")
	
	// ErrInvalidNetwork represents an error for unsupported network
	ErrInvalidNetwork = errors.New("unsupported network implementation")
)

// NetworkImpl represents different blockchain implementations
const (
	ImplBaronChain = "BARON"
	ImplEthereum   = "ETH"
	ImplBinance    = "BNB"
	ImplPolygon    = "POLYGON"
)

// NetworkConfig holds the configuration for different blockchain networks
type NetworkConfig struct {
	ImplName      string
	DefaultClient string
	Decimals      uint8
	FeeDecimals   uint8
}

// NetworkConfigs maps implementation types to their configurations
var NetworkConfigs = map[string]NetworkConfig{
	ImplBaronChain: {
		ImplName:      "baron",
		DefaultClient: "BaronClient",
		Decimals:      18,
		FeeDecimals:   9,
	},
	ImplEthereum: {
		ImplName:      "eth",
		DefaultClient: "Geth",
		Decimals:      18,
		FeeDecimals:   9,
	},
	ImplBinance: {
		ImplName:      "bnb",
		DefaultClient: "BscClient",
		Decimals:      18,
		FeeDecimals:   9,
	},
	ImplPolygon: {
		ImplName:      "polygon",
		DefaultClient: "PolygonClient",
		Decimals:      18,
		FeeDecimals:   9,
	},
}

// UnsignedTxParams contains parameters for creating an unsigned transaction
type UnsignedTxParams struct {
	Network     types.Network
	Account     types.Account
	From        string
	To          string
	Value       *big.Int
	ValueOnChain string
	Token       *types.Token
	Extra       map[string]interface{}
}

// CreateUnsignedTransaction creates an unsigned transaction with the given parameters
func CreateUnsignedTransaction(params UnsignedTxParams) (*types.UnsignedTx, error) {
	if err := validateAddress(params.From); err != nil {
		return nil, err
	}
	if err := validateAddress(params.To); err != nil {
		return nil, err
	}

	value := new(big.Int)
	if len(params.ValueOnChain) > 0 {
		value.SetString(params.ValueOnChain, 10)
	} else if params.Value != nil {
		value = params.Value
		if params.Token != nil {
			value = shiftDecimals(value, params.Token.Decimals)
		} else {
			value = shiftDecimals(value, params.Network.Decimals)
		}
	}

	// Prepare transaction input
	input := types.TxInput{
		Address:     params.From,
		Value:       value,
		TokenID:     getTokenID(params.Token),
		PublicKey:   params.Account.PublicKey,
	}

	// Handle quantum-safe encryption for Baron Chain
	if params.Network.Implementation == ImplBaronChain {
		kyberKey, err := kyber.NewKeyPair()
		if err != nil {
			return nil, err
		}
		input.QuantumPublicKey = kyberKey.PublicKeyBytes()
	}

	// Create transaction output
	output := types.TxOutput{
		Address:   params.To,
		Value:     value,
		TokenID:   getTokenID(params.Token),
	}

	// Handle gas fees and EIP-1559 if present in extra params
	fees, err := processFees(params.Network, params.Extra)
	if err != nil {
		return nil, err
	}

	return &types.UnsignedTx{
		Inputs:         []types.TxInput{input},
		Outputs:        []types.TxOutput{output},
		Type:           getTransactionType(params.Extra),
		Nonce:          getNonce(params.Extra),
		FeeLimit:       fees.FeeLimit,
		FeePricePerUnit: fees.FeePricePerUnit,
		Extra:          params.Extra,
	}, nil
}

// processFees handles transaction fee calculations
func processFees(network types.Network, extra map[string]interface{}) (*types.TxFees, error) {
	fees := &types.TxFees{}

	if maxFee, ok := extra["maxFeePerGas"].(*big.Int); ok {
		if maxPriorityFee, ok := extra["maxPriorityFeePerGas"].(*big.Int); ok {
			fees.IsEIP1559 = true
			fees.MaxFeePerGas = maxFee
			fees.MaxPriorityFeePerGas = maxPriorityFee
		}
	}

	if feeLimit, ok := extra["feeLimit"].(*big.Int); ok {
		fees.FeeLimit = feeLimit
	}

	if feePricePerUnit, ok := extra["feePricePerUnit"].(*big.Int); ok {
		fees.FeePricePerUnit = feePricePerUnit
	}

	return fees, nil
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

// Utility functions
func validateAddress(address string) error {
	if len(address) == 0 {
		return ErrInvalidAddress
	}
	return nil
}

func shiftDecimals(value *big.Int, decimals uint8) *big.Int {
	result := new(big.Int).Set(value)
	return result.Mul(result, new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(decimals)), nil))
}

func getTokenID(token *types.Token) string {
	if token == nil {
		return ""
	}
	return token.TokenID
}

func getTransactionType(extra map[string]interface{}) string {
	if txType, ok := extra["type"].(string); ok {
		return txType
	}
	return "default"
}

func getNonce(extra map[string]interface{}) uint64 {
	if nonce, ok := extra["nonce"].(uint64); ok {
		return nonce
	}
	return 0
}
