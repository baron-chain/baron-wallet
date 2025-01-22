package price

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"sync"
	"time"

	"github.com/baron-chain/baron-wallet/types"
	"github.com/hashicorp/golang-lru/v2/expirable"
)

var (
	// ErrFetchPrices represents an error when fetching price data
	ErrFetchPrices = errors.New("failed to fetch price data")
	
	// ErrInvalidResponse represents an invalid API response
	ErrInvalidResponse = errors.New("invalid API response")
	
	// ErrRateLimitExceeded represents a rate limit error
	ErrRateLimitExceeded = errors.New("rate limit exceeded")
)

const (
	// DefaultCacheDuration represents default cache duration
	DefaultCacheDuration = 30 * time.Second
	
	// DefaultCacheSize represents default cache size
	DefaultCacheSize = 300
	
	// BatchSize represents maximum tokens per request
	BatchSize = 100
	
	// DefaultCurrency represents default currency for price data
	DefaultCurrency = "usd"
)

// ChartPoint represents a single point in price chart data
type ChartPoint struct {
	Timestamp int64
	Price     *big.Float
}

// PriceData represents price information for a token
type PriceData struct {
	Price      *big.Float
	ChartData  []ChartPoint
	LastUpdate time.Time
}

// ChartQueryParams represents parameters for chart data queries
type ChartQueryParams struct {
	NetworkID  string
	Addresses  []string
	Days       int
	Currency   string
	Points     int
}

// PriceController manages token price data and caching
type PriceController struct {
	baseURL     string
	client      *http.Client
	cache       *expirable.LRU[string, *PriceData]
	mu          sync.RWMutex
	networks    map[string]types.NetworkPriceConfig
}

// NewPriceController creates a new instance of PriceController
func NewPriceController(baseURL string, networks map[string]types.NetworkPriceConfig) *PriceController {
	cache := expirable.NewLRU[string, *PriceData](DefaultCacheSize, nil, DefaultCacheDuration)
	
	return &PriceController{
		baseURL:  baseURL,
		client:   &http.Client{Timeout: 60 * time.Second},
		cache:    cache,
		networks: networks,
	}
}

// GetTokenPrices fetches current prices and chart data for tokens
func (pc *PriceController) GetTokenPrices(ctx context.Context, networkID string, tokenAddresses []string, includeNative bool) (*types.TokenPrices, error) {
	result := &types.TokenPrices{
		Prices: make(map[string]*big.Float),
		Charts: make(map[string][]ChartPoint),
	}

	network, exists := pc.networks[networkID]
	if !exists {
		return result, nil
	}

	// Fetch native token price if requested
	if includeNative && network.NativeToken != "" {
		nativePrice, nativeChart, err := pc.fetchTokenData(ctx, networkID, "native", network.NativeToken)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch native token price: %w", err)
		}
		if nativePrice != nil {
			result.Prices["native"] = nativePrice
			result.Charts["native"] = nativeChart
		}
	}

	// Process token addresses in batches
	for i := 0; i < len(tokenAddresses); i += BatchSize {
		end := i + BatchSize
		if end > len(tokenAddresses) {
			end = len(tokenAddresses)
		}
		
		batch := tokenAddresses[i:end]
		prices, charts, err := pc.fetchBatchPrices(ctx, networkID, batch)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch batch prices: %w", err)
		}

		// Merge batch results
		for addr, price := range prices {
			result.Prices[addr] = price
		}
		for addr, chart := range charts {
			result.Charts[addr] = chart
		}
	}

	return result, nil
}

// fetchTokenData fetches price and chart data for a single token
func (pc *PriceController) fetchTokenData(ctx context.Context, networkID, address, symbol string) (*big.Float, []ChartPoint, error) {
	cacheKey := fmt.Sprintf("%s_%s_%s", networkID, address, symbol)
	
	// Check cache first
	if cached, exists := pc.cache.Get(cacheKey); exists {
		return cached.Price, cached.ChartData, nil
	}

	// Prepare request parameters
	params := map[string]string{
		"network":     networkID,
		"address":     address,
		"vs_currency": DefaultCurrency,
		"days":        "1",
		"points":      "24",
	}

	// Fetch data from API
	data, err := pc.fetchFromAPI(ctx, "/v1/prices/chart", params)
	if err != nil {
		return nil, nil, err
	}

	var response struct {
		Prices [][]float64 `json:"prices"`
	}
	
	if err := json.Unmarshal(data, &response); err != nil {
		return nil, nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	// Process response
	var chartData []ChartPoint
	var latestPrice *big.Float

	for _, point := range response.Prices {
		if len(point) != 2 {
			continue
		}
		
		timestamp := int64(point[0])
		price := new(big.Float).SetFloat64(point[1])
		
		chartData = append(chartData, ChartPoint{
			Timestamp: timestamp,
			Price:     price,
		})
		
		latestPrice = price // Store the latest price
	}

	// Cache the results
	pc.cache.Add(cacheKey, &PriceData{
		Price:      latestPrice,
		ChartData:  chartData,
		LastUpdate: time.Now(),
	})

	return latestPrice, chartData, nil
}

// fetchBatchPrices fetches prices for multiple tokens in a single request
func (pc *PriceController) fetchBatchPrices(ctx context.Context, networkID string, addresses []string) (map[string]*big.Float, map[string][]ChartPoint, error) {
	prices := make(map[string]*big.Float)
	charts := make(map[string][]ChartPoint)

	params := map[string]string{
		"network":     networkID,
		"vs_currency": DefaultCurrency,
		"addresses":   joinAddresses(addresses),
	}

	data, err := pc.fetchFromAPI(ctx, "/v1/prices/batch", params)
	if err != nil {
		return nil, nil, err
	}

	var response map[string]struct {
		Price  string      `json:"price"`
		Charts [][]float64 `json:"chart"`
	}

	if err := json.Unmarshal(data, &response); err != nil {
		return nil, nil, fmt.Errorf("failed to unmarshal batch response: %w", err)
	}

	for addr, tokenData := range response {
		price, ok := new(big.Float).SetString(tokenData.Price)
		if !ok {
			continue
		}
		prices[addr] = price

		var chartPoints []ChartPoint
		for _, point := range tokenData.Charts {
			if len(point) != 2 {
				continue
			}
			chartPoints = append(chartPoints, ChartPoint{
				Timestamp: int64(point[0]),
				Price:     new(big.Float).SetFloat64(point[1]),
			})
		}
		charts[addr] = chartPoints
	}

	return prices, charts, nil
}

// fetchFromAPI performs the actual HTTP request to the price API
func (pc *PriceController) fetchFromAPI(ctx context.Context, endpoint string, params map[string]string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", pc.baseURL+endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add query parameters
	q := req.URL.Query()
	for key, value := range params {
		q.Add(key, value)
	}
	req.URL.RawQuery = q.Encode()

	resp, err := pc.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusTooManyRequests {
		return nil, ErrRateLimitExceeded
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%w: status code %d", ErrInvalidResponse, resp.StatusCode)
	}

	body := make([]byte, 0)
	if _, err := resp.Body.Read(body); err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	return body, nil
}

// Helper function to join addresses for batch requests
func joinAddresses(addresses []string) string {
	if len(addresses) == 0 {
		return ""
	}
	
	result := addresses[0]
	for _, addr := range addresses[1:] {
		result += "," + addr
	}
	return result
}
