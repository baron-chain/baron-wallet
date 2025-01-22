package config

import (
	"fmt"
	"strings"
	"sync/atomic"
)

// EndpointMode represents the environment mode for endpoints
type EndpointMode uint32

const (
	// EndpointModeProd represents production environment
	EndpointModeProd EndpointMode = iota
	// EndpointModeTest represents test environment
	EndpointModeTest
)

// NetworkType represents the network type
type NetworkType string

const (
	// NetworkMainnet represents mainnet network
	NetworkMainnet NetworkType = "mainnet"
	// NetworkTestnet represents testnet network
	NetworkTestnet NetworkType = "testnet"
)

// ChainType represents the blockchain type
type ChainType string

const (
	// ChainBTC represents Bitcoin chain
	ChainBTC ChainType = "btc"
)

// EndpointConfig holds configuration for different endpoints
type EndpointConfig struct {
	Prod string
	Test string
}

// EndpointConfigs holds all endpoint configurations
type EndpointConfigs struct {
	Fiat       EndpointConfig
	WSS        EndpointConfig
	Covalent   EndpointConfig
	Mempool    EndpointConfig
	GetBlock   EndpointConfig
	AlgoSigner EndpointConfig
	TronScan   EndpointConfig
	SolScan    EndpointConfig
}

var (
	// defaultEndpoints defines default endpoint configurations
	defaultEndpoints = EndpointConfigs{
		Fiat: EndpointConfig{
			Prod: "https://api.baron-chain.com/api",
			Test: "https://api-sandbox.baron-chain.com/api",
		},
		WSS: EndpointConfig{
			Prod: "wss://api.baron-chain.com",
			Test: "wss://api-sandbox.baron-chain.com",
		},
		Covalent: EndpointConfig{
			Prod: "https://node.baron-chain.com/covalent/client1-HghTg3a33",
			Test: "https://node-test.baron-chain.com/covalent/client1-HghTg3a33",
		},
		Mempool: EndpointConfig{
			Prod: "https://node.baron-chain.com/mempool",
			Test: "https://node-test.baron-chain.com/mempool",
		},
		GetBlock: EndpointConfig{
			Prod: "https://node.baron-chain.com/getblock-{chain}-{network}",
			Test: "https://node-test.baron-chain.com/getblock-{chain}-{network}",
		},
		AlgoSigner: EndpointConfig{
			Prod: "https://node.baron-chain.com/algosigner/{network}/indexer",
			Test: "https://node-test.baron-chain.com/algosigner/{network}/indexer",
		},
		TronScan: EndpointConfig{
			Prod: "https://node.baron-chain.com/tronscan",
			Test: "https://node-test.baron-chain.com/tronscan",
		},
		SolScan: EndpointConfig{
			Prod: "https://node.baron-chain.com/solscan",
			Test: "https://node-test.baron-chain.com/solscan",
		},
	}

	currentMode uint32 = uint32(EndpointModeProd)
)

// EndpointManager manages endpoint configurations and mode
type EndpointManager struct {
	endpoints EndpointConfigs
}

// NewEndpointManager creates a new EndpointManager instance
func NewEndpointManager() *EndpointManager {
	return &EndpointManager{
		endpoints: defaultEndpoints,
	}
}

// getEndpoint gets the endpoint based on current mode
func (m *EndpointManager) getEndpoint(config EndpointConfig) string {
	if atomic.LoadUint32(&currentMode) == uint32(EndpointModeTest) {
		return config.Test
	}
	return config.Prod
}

// SwitchMode switches between test and production mode
func SwitchMode(isTest bool) {
	if isTest {
		atomic.StoreUint32(&currentMode, uint32(EndpointModeTest))
	} else {
		atomic.StoreUint32(&currentMode, uint32(EndpointModeProd))
	}
}

// GetFiatEndpoint returns the fiat API endpoint
func (m *EndpointManager) GetFiatEndpoint() string {
	return m.getEndpoint(m.endpoints.Fiat)
}

// GetWSEndpoint returns the WebSocket endpoint
func (m *EndpointManager) GetWSEndpoint() string {
	return m.getEndpoint(m.endpoints.WSS)
}

// GetCovalentEndpoint returns the Covalent API endpoint
func (m *EndpointManager) GetCovalentEndpoint() string {
	return m.getEndpoint(m.endpoints.Covalent)
}

// GetMempoolEndpoint returns the Mempool endpoint
func (m *EndpointManager) GetMempoolEndpoint(network NetworkType) string {
	base := m.getEndpoint(m.endpoints.Mempool)
	if network == NetworkMainnet {
		return base
	}
	return fmt.Sprintf("%s/%s", base, network)
}

// GetBlockEndpoint returns the GetBlock endpoint
func (m *EndpointManager) GetBlockEndpoint(chain ChainType, network NetworkType) string {
	endpoint := m.getEndpoint(m.endpoints.GetBlock)
	endpoint = strings.Replace(endpoint, "{chain}", string(chain), 1)
	return strings.Replace(endpoint, "{network}", string(network), 1)
}

// GetAlgoSignerEndpoint returns the AlgoSigner endpoint
func (m *EndpointManager) GetAlgoSignerEndpoint(network NetworkType) string {
	endpoint := m.getEndpoint(m.endpoints.AlgoSigner)
	return strings.Replace(endpoint, "{network}", string(network), 1)
}

// GetTronScanEndpoint returns the TronScan endpoint
func (m *EndpointManager) GetTronScanEndpoint() string {
	return m.getEndpoint(m.endpoints.TronScan)
}

// GetSolScanEndpoint returns the SolScan endpoint
func (m *EndpointManager) GetSolScanEndpoint() string {
	return m.getEndpoint(m.endpoints.SolScan)
}

// LoadCustomEndpoints allows loading custom endpoint configurations
func (m *EndpointManager) LoadCustomEndpoints(endpoints EndpointConfigs) {
	m.endpoints = endpoints
}

// Example usage:
//
//	manager := NewEndpointManager()
//	SwitchMode(true) // Switch to test mode
//	fiatEndpoint := manager.GetFiatEndpoint()
//	wsEndpoint := manager.GetWSEndpoint()
//	mempoolEndpoint := manager.GetMempoolEndpoint(NetworkTestnet)
//	blockEndpoint := manager.GetBlockEndpoint(ChainBTC, NetworkMainnet)
