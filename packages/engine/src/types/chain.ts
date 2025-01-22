package types

// CurveType represents the cryptographic curve used by a chain
type CurveType string

const (
    CurveSecp256k1 CurveType = "secp256k1"
    CurveEd25519   CurveType = "ed25519"
)

// ChainClient represents a client configuration for a specific chain
type ChainClient struct {
    Name string `json:"name"`
    Args []any  `json:"args"`
}

// ChainInfo contains detailed information about a blockchain
type ChainInfo struct {
    Code         string                 `json:"code"`
    FeeCode      string                 `json:"feeCode"`
    Impl         string                 `json:"impl"`
    Curve        CurveType              `json:"curve"`
    ImplOptions  map[string]interface{} `json:"implOptions"`
    Clients      []ChainClient          `json:"clients"`
}

// CoinInfo represents information about a specific cryptocurrency or token
type CoinInfo struct {
    Code         string                 `json:"code"`
    ChainCode    string                 `json:"chainCode"`
    Decimals     int                    `json:"decimals"`
    TokenAddress *string                `json:"tokenAddress,omitempty"`
    Options      map[string]interface{} `json:"options,omitempty"`
}

// Validate methods to ensure data integrity

// Validate checks if the ChainInfo is valid
func (ci *ChainInfo) Validate() error {
    if ci.Code == "" {
        return fmt.Errorf("chain code cannot be empty")
    }
    
    if ci.Impl == "" {
        return fmt.Errorf("chain implementation cannot be empty")
    }
    
    switch ci.Curve {
    case CurveSecp256k1, CurveEd25519:
        // Valid curve
    default:
        return fmt.Errorf("invalid curve type: %s", ci.Curve)
    }
    
    return nil
}

// Validate checks if the CoinInfo is valid
func (ci *CoinInfo) Validate() error {
    if ci.Code == "" {
        return fmt.Errorf("coin code cannot be empty")
    }
    
    if ci.ChainCode == "" {
        return fmt.Errorf("chain code cannot be empty")
    }
    
    if ci.Decimals < 0 {
        return fmt.Errorf("decimals cannot be negative")
    }
    
    return nil
}
