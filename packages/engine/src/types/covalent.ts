package types

// TxStatus represents the status of a transaction
type TxStatus string

const (
    TxStatusPending   TxStatus = "Pending"
    TxStatusConfirmed TxStatus = "Confirmed"
    TxStatusFailed    TxStatus = "Failed"
    TxStatusDropped   TxStatus = "Dropped"
    TxStatusRemoved   TxStatus = "Removed"
)

// EVMTxFromType represents the type of transaction based on sender/receiver
type EVMTxFromType string

const (
    TxFromTypeIn   EVMTxFromType = "in"   // received
    TxFromTypeOut  EVMTxFromType = "out"  // sent
    TxFromTypeSelf EVMTxFromType = "self" // sent to self
)

// EVMDecodedTxType represents the type of EVM transaction
type EVMDecodedTxType string

const (
    TxTypeTransfer           EVMDecodedTxType = "Transfer"
    TxTypeReceive            EVMDecodedTxType = "Receive"
    TxTypeContractExecution  EVMDecodedTxType = "ContractExecution"
)
