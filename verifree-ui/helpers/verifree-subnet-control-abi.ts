export const verifreeSubnetControlAbi = [
    {
        inputs: [
            {
                internalType: "address",
                name: "_txAllowListPrecompileAddress",
                type: "address",
            },
            {
                internalType: "address",
                name: "_contractAllowListPrecompileAddress",
                type: "address",
            },
            {
                internalType: "address",
                name: "_nativeMinterPrecompileAddress",
                type: "address",
            },
            {
                internalType: "address",
                name: "_teleporterMessenger",
                type: "address",
            },
            {
                internalType: "bytes32",
                name: "_initialOriginChainID",
                type: "bytes32",
            },
            {
                internalType: "address",
                name: "_initialSender",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "_nativeCoinAmount",
                type: "uint256",
            },
            {
                internalType: "string",
                name: "_tokenUri",
                type: "string",
            },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "bytes32",
                name: "originChainID",
                type: "bytes32",
            },
            {
                indexed: false,
                internalType: "bool",
                name: "allow",
                type: "bool",
            },
        ],
        name: "AllowedOriginChainUpdated",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "sender",
                type: "address",
            },
            {
                indexed: false,
                internalType: "bool",
                name: "allow",
                type: "bool",
            },
        ],
        name: "AllowedSenderUpdated",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "nativeCoinAmount",
                type: "uint256",
            },
        ],
        name: "NativeCoinAmountUpdated",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "previousOwner",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "newOwner",
                type: "address",
            },
        ],
        name: "OwnershipTransferred",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "newTeleporterMessenger",
                type: "address",
            },
        ],
        name: "TeleporterMessengerUpdated",
        type: "event",
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "",
                type: "bytes32",
            },
        ],
        name: "allowedOriginChains",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        name: "allowedSenders",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "contractAllowListPrecompile",
        outputs: [
            {
                internalType: "contract IAllowList",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "nativeCoinAmount",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "nativeMinterPrecompile",
        outputs: [
            {
                internalType: "contract INativeMinter",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "owner",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "originChainID",
                type: "bytes32",
            },
            {
                internalType: "address",
                name: "originSenderAddress",
                type: "address",
            },
            {
                internalType: "bytes",
                name: "message",
                type: "bytes",
            },
        ],
        name: "receiveTeleporterMessage",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "teleporterMessenger",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "newOwner",
                type: "address",
            },
        ],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "txAllowListPrecompile",
        outputs: [
            {
                internalType: "contract IAllowList",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "originChainID",
                type: "bytes32",
            },
            {
                internalType: "bool",
                name: "allow",
                type: "bool",
            },
        ],
        name: "updateAllowedOriginChain",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "sender",
                type: "address",
            },
            {
                internalType: "bool",
                name: "allow",
                type: "bool",
            },
        ],
        name: "updateAllowedSender",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_nativeCoinAmount",
                type: "uint256",
            },
        ],
        name: "updateNativeCoinAmount",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_teleporterMessenger",
                type: "address",
            },
        ],
        name: "updateTeleporterMessenger",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        name: "updatedAddresses",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "vsbt",
        outputs: [
            {
                internalType: "contract VerifiedStudentSBT",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
] as const;