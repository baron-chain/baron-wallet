package types

// EIP1559Fee represents the fee structure for EIP-1559 transactions
type EIP1559Fee struct {
    Price                 float64 `json:"price"`
    MaxPriorityFeePerGas float64 `json:"maxPriorityFeePerGas"`
    MaxFeePerGas         float64 `json:"maxFeePerGas"`
}

// BlockNativeGasInfo contains gas estimation information
type BlockNativeGasInfo struct {
    EstimatedTransactionCount int           `json:"estimatedTransactionCount"`
    BaseFee                   string        `json:"baseFee"`
    Prices                    []EIP1559Fee  `json:"prices"`
    MaxPrice                  float64       `json:"maxPrice"`
    Unit                      string        `json:"unit"`
}

// EstimatedPrice represents a single gas price estimate
type EstimatedPrice struct {
    Confidence             float64 `json:"confidence"`
    Price                  float64 `json:"price"`
    MaxPriorityFeePerGas   float64 `json:"maxPriorityFeePerGas"`
    MaxFeePerGas           float64 `json:"maxFeePerGas"`
}

// BlockPrice contains price information for a specific block
type BlockPrice struct {
    BlockNumber               int                `json:"blockNumber"`
    EstimatedTransactionCount int                `json:"estimatedTransactionCount"`
    BaseFeePerGas             float64            `json:"baseFeePerGas"`
    EstimatedPrices           []EstimatedPrice   `json:"estimatedPrices"`
}

// BlockNativeGasAPIResponse represents the full response from a gas price API
type BlockNativeGasAPIResponse struct {
    System               string       `json:"system"`
    Network             string       `json:"network"`
    Unit                string       `json:"unit"`
    MaxPrice            float64      `json:"maxPrice"`
    CurrentBlockNumber  int          `json:"currentBlockNumber"`
    MsSinceLastBlock    int          `json:"msSinceLastBlock"`
    BlockPrices         []BlockPrice `json:"blockPrices"`
}
