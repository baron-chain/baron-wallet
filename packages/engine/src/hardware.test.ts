package hardware_test

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"testing"

	"github.com/baron-chain/baron-wallet/crypto/kyber"
	"github.com/baron-chain/baron-wallet/hardware"
	"github.com/baron-chain/baron-wallet/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Mock hardware device for testing
type mockDevice struct {
	messageHashResult string
	messageHexResult  string
}

func (m *mockDevice) SignTypedData(chainID uint64, messageHash []byte) ([]byte, error) {
	m.messageHashResult = hex.EncodeToString(messageHash)
	return []byte{}, nil
}

func (m *mockDevice) SignMessage(chainID uint64, messageHex []byte) ([]byte, error) {
	m.messageHexResult = hex.EncodeToString(messageHex)
	return []byte{}, nil
}

func TestMessageSigning(t *testing.T) {
	ctx := context.Background()
	mockDev := &mockDevice{}
	kyberManager := kyber.NewManager()
	hw := hardware.NewHardwareManager(kyberManager)

	// Helper function to sign messages
	signMessage := func(message *types.UnsignedMessage) error {
		opts := &types.SignMessageOptions{
			DeviceID:    "testDevice",
			ChainID:     1,
			Path:        "m/44'/60'/0'/0/0",
			Message:     message.Message,
			MessageType: message.Type,
		}
		_, err := hw.EVMSignMessage(ctx, opts)
		return err
	}

	t.Run("ETH_SIGN", func(t *testing.T) {
		t.Run("should hash message", func(t *testing.T) {
			message := "0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0"
			err := signMessage(&types.UnsignedMessage{
				Type:    types.MessageTypeETHSign,
				Message: message,
			})
			require.NoError(t, err)
			assert.Equal(t, message[2:], mockDev.messageHexResult)
		})
	})

	t.Run("PERSONAL_SIGN", func(t *testing.T) {
		t.Run("should hash message", func(t *testing.T) {
			message := "0x4578616d706c652060706572736f6e616c5f7369676e60206d657373616765"
			err := signMessage(&types.UnsignedMessage{
				Type:    types.MessageTypePersonalSign,
				Message: message,
			})
			require.NoError(t, err)
			assert.Equal(t, message[2:], mockDev.messageHexResult)
		})
	})

	t.Run("TYPED_DATA_V1", func(t *testing.T) {
		t.Run("should reject unsupported version", func(t *testing.T) {
			err := signMessage(&types.UnsignedMessage{
				Type:    types.MessageTypeTypedDataV1,
				Message: "",
			})
			require.Error(t, err)
			assert.Contains(t, err.Error(), "not supported for this device")
		})
	})

	t.Run("TYPED_DATA_V3", func(t *testing.T) {
		t.Run("should hash data with custom type", func(t *testing.T) {
			types := map[string][]types.TypedDataField{
				"Person": {
					{Name: "name", Type: "string"},
					{Name: "wallet", Type: "address"},
				},
				"Mail": {
					{Name: "from", Type: "Person"},
					{Name: "to", Type: "Person"},
					{Name: "contents", Type: "string"},
				},
			}

			message := map[string]interface{}{
				"from": map[string]interface{}{
					"name":   "Cow",
					"wallet": "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
				},
				"to": map[string]interface{}{
					"name":   "Bob",
					"wallet": "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
				},
				"contents": "Hello, Bob!",
			}

			data := types.TypedData{
				Types:       types,
				PrimaryType: "Mail",
				Message:     message,
			}

			jsonData, err := json.Marshal(data)
			require.NoError(t, err)

			err = signMessage(&types.UnsignedMessage{
				Type:    types.MessageTypeTypedDataV3,
				Message: string(jsonData),
			})
			require.NoError(t, err)
			assert.NotEmpty(t, mockDev.messageHashResult)
		})

		t.Run("should hash data with recursive types", func(t *testing.T) {
			types := map[string][]types.TypedDataField{
				"Person": {
					{Name: "name", Type: "string"},
					{Name: "wallet", Type: "address"},
				},
				"Mail": {
					{Name: "from", Type: "Person"},
					{Name: "to", Type: "Person"},
					{Name: "contents", Type: "string"},
					{Name: "replyTo", Type: "Mail"},
				},
			}

			message := map[string]interface{}{
				"from": map[string]interface{}{
					"name":   "Cow",
					"wallet": "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
				},
				"to": map[string]interface{}{
					"name":   "Bob",
					"wallet": "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
				},
				"contents": "Hello, Bob!",
				"replyTo": map[string]interface{}{
					"to": map[string]interface{}{
						"name":   "Cow",
						"wallet": "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
					},
					"from": map[string]interface{}{
						"name":   "Bob",
						"wallet": "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
					},
					"contents": "Hello!",
				},
			}

			data := types.TypedData{
				Types:       types,
				PrimaryType: "Mail",
				Message:     message,
			}

			jsonData, err := json.Marshal(data)
			require.NoError(t, err)

			err = signMessage(&types.UnsignedMessage{
				Type:    types.MessageTypeTypedDataV3,
				Message: string(jsonData),
			})
			require.NoError(t, err)
			assert.NotEmpty(t, mockDev.messageHashResult)
		})

		t.Run("should reject arrays in V3", func(t *testing.T) {
			types := map[string][]types.TypedDataField{
				"Message": {
					{Name: "data", Type: "string[]"},
				},
			}

			message := map[string]interface{}{
				"data": []string{"1", "2", "3"},
			}

			data := types.TypedData{
				Types:       types,
				PrimaryType: "Message",
				Message:     message,
			}

			jsonData, err := json.Marshal(data)
			require.NoError(t, err)

			err = signMessage(&types.UnsignedMessage{
				Type:    types.MessageTypeTypedDataV3,
				Message: string(jsonData),
			})
			require.Error(t, err)
			assert.Contains(t, err.Error(), "Arrays are unimplemented in encodeData")
		})
	})

	t.Run("TYPED_DATA_V4", func(t *testing.T) {
		t.Run("should hash data with arrays", func(t *testing.T) {
			types := map[string][]types.TypedDataField{
				"Person": {
					{Name: "name", Type: "string"},
					{Name: "wallet", Type: "address[]"},
				},
				"Mail": {
					{Name: "from", Type: "Person"},
					{Name: "to", Type: "Person[]"},
					{Name: "contents", Type: "string"},
				},
			}

			message := map[string]interface{}{
				"from": map[string]interface{}{
					"name": "Cow",
					"wallet": []string{
						"0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
						"0xDD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
					},
				},
				"to": []map[string]interface{}{
					{
						"name": "Bob",
						"wallet": []string{
							"0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
						},
					},
				},
				"contents": "Hello, Bob!",
			}

			data := types.TypedData{
				Types:       types,
				PrimaryType: "Mail",
				Message:     message,
			}

			jsonData, err := json.Marshal(data)
			require.NoError(t, err)

			err = signMessage(&types.UnsignedMessage{
				Type:    types.MessageTypeTypedDataV4,
				Message: string(jsonData),
			})
			require.NoError(t, err)
			assert.NotEmpty(t, mockDev.messageHashResult)
		})
	})

	// Test quantum-safe signature verification
	t.Run("Quantum Safe Verification", func(t *testing.T) {
		message := "Test message"
		keyPair, err := kyberManager.GenerateKeyPair()
		require.NoError(t, err)

		// Sign with quantum-safe signature
		signature, err := kyberManager.Sign(keyPair, []byte(message))
		require.NoError(t, err)

		// Verify with quantum-safe verification
		valid, err := kyberManager.Verify(keyPair.PublicKey, []byte(message), signature)
		require.NoError(t, err)
		assert.True(t, valid)
	})
}

func TestMessageTypeCompatibility(t *testing.T) {
	// Test compatibility between V3 and V4 for simple messages
	t.Run("V3 and V4 compatibility for simple messages", func(t *testing.T) {
		ctx := context.Background()
		mockDev := &mockDevice{}
		kyberManager := kyber.NewManager()
		hw := hardware.NewHardwareManager(kyberManager)

		types := map[string][]types.TypedDataField{
			"Person": {
				{Name: "name", Type: "string"},
				{Name: "wallet", Type: "address"},
			},
			"Mail": {
				{Name: "from", Type: "Person"},
				{Name: "to", Type: "Person"},
				{Name: "contents", Type: "string"},
			},
		}

		message := map[string]interface{}{
			"from": map[string]interface{}{
				"name":   "Cow",
				"wallet": "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
			},
			"to": map[string]interface{}{
				"name":   "Bob",
				"wallet": "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
			},
			"contents": "Hello, Bob!",
		}

		data := types.TypedData{
			Types:       types,
			PrimaryType: "Mail",
			Message:     message,
		}

		jsonData, err := json.Marshal(data)
		require.NoError(t, err)

		// Sign with V3
		v3Opts := &types.SignMessageOptions{
			DeviceID:    "testDevice",
			ChainID:     1,
			Path:        "m/44'/60'/0'/0/0",
			Message:     string(jsonData),
			MessageType: types.MessageTypeTypedDataV3,
		}
		v3Result, err := hw.EVMSignMessage(ctx, v3Opts)
		require.NoError(t, err)

		// Sign with V4
		v4Opts := &types.SignMessageOptions{
			DeviceID:    "testDevice",
			ChainID:     1,
			Path:        "m/44'/60'/0'/0/0",
			Message:     string(jsonData),
			MessageType: types.MessageTypeTypedDataV4,
		}
		v4Result, err := hw.EVMSignMessage(ctx, v4Opts)
		require.NoError(t, err)

		// Hash results should be the same for compatible messages
		assert.Equal(t, v3Result.Hash, v4Result.Hash)
	})
}
