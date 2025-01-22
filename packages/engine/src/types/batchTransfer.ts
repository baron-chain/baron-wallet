package types

// BatchTransferMethods defines the method signatures for batch transfers
type BatchTransferMethods string

const (
    DisperseBatchNFT              BatchTransferMethods = "disperseNFT(address,address[],uint256[],uint256[])"
    DisperseBatchEther            BatchTransferMethods = "disperseEther(address[],uint256[])"
    DisperseBatchToken            BatchTransferMethods = "disperseToken(address,address[],uint256[])"
    DisperseBatchTokenSimple      BatchTransferMethods = "disperseTokenSimple(address,address[],uint256[])"
    DisperseBatchEtherSameValue   BatchTransferMethods = "disperseEtherSameValue(address[],uint256)"
    DisperseBatchTokenSameValue   BatchTransferMethods = "disperseTokenSameValue(address,address[],uint256)"
)

// BatchTransferSelectors defines the method selectors for batch transfers
type BatchTransferSelectors string

const (
    SelectorDisperseBatchNFT              BatchTransferSelectors = "0x39039af6"
    SelectorDisperseBatchEther            BatchTransferSelectors = "0xe63d38ed"
    SelectorDisperseBatchToken            BatchTransferSelectors = "0xc73a2d60"
    SelectorDisperseBatchTokenSimple      BatchTransferSelectors = "0x51ba162c"
    SelectorDisperseBatchEtherSameValue   BatchTransferSelectors = "0xc263a3e4"
    SelectorDisperseBatchTokenSameValue   BatchTransferSelectors = "0x17546c6c"
)

// BulkTransferType defines the type of bulk transfer
type BulkTransferType string

const (
    OneToMany    BulkTransferType = "OneToMany"
    ManyToMany   BulkTransferType = "ManyToMany"
    ManyToOne    BulkTransferType = "ManyToOne"
)
