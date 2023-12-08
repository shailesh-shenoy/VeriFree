// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.16;

import "./IAllowList.sol";
import "./ITeleporterReceiver.sol";
import "./VerifiedStudentSBT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./INativeMinter.sol";

contract VeriFreeSubnetControl is ITeleporterReceiver, Ownable {
    // Precompile contracts
    IAllowList public immutable txAllowListPrecompile;
    IAllowList public immutable contractAllowListPrecompile;
    INativeMinter public immutable nativeMinterPrecompile;

    // State variables for administrative purposes
    address public teleporterMessenger;
    mapping(bytes32 => bool) public allowedOriginChains;
    mapping(address => bool) public allowedSenders;
    uint256 public nativeCoinAmount;

    // State variables for tracking minted addresses
    VerifiedStudentSBT public vsbt;
    mapping(address => bool) public updatedAddresses;

    struct AccessInfo {
        address addressToUpdate;
        bool transactionsAllowed;
        bool transactionsAdmin;
        bool contractsAllowed;
        bool contractsAdmin;
        bool mintSubnetVSBT;
    }

    modifier onlyTeleporterMessenger() {
        require(
            msg.sender == teleporterMessenger,
            "Only TeleporterMessenger can call this function"
        );
        _;
    }

    modifier onlyAllowedOriginChain(bytes32 originChainID) {
        require(
            allowedOriginChains[originChainID],
            "Origin chain is not allowed"
        );
        _;
    }

    modifier onlyAllowedSender(address sender) {
        require(allowedSenders[sender], "Sender is not allowed");
        _;
    }

    event TeleporterMessengerUpdated(address indexed _newTeleporterMessenger);
    event AllowedOriginChainUpdated(bytes32 indexed _originChainID, bool allow);
    event AllowedSenderUpdated(address indexed _sender, bool allow);
    event NativeCoinAmountUpdated(uint256 _nativeCoinAmount);
    event TeleporterMessageReceived(
        bytes32 indexed _originChainID,
        address indexed _originSenderAddress,
        bytes message
    );
    event TxAllowListUpdated(
        address indexed _updatedAddress,
        uint256 indexed _updatedRole
    );
    event ContractAllowListUpdated(
        address indexed _updatedAddress,
        uint256 indexed _updatedRole
    );
    event NativeCoinMinted(address indexed _to, uint256 _amount);
    event VSBTMinted(address indexed _to, uint256 _tokenId);

    constructor(
        address _txAllowListPrecompileAddress,
        address _contractAllowListPrecompileAddress,
        address _nativeMinterPrecompileAddress,
        address _teleporterMessenger,
        bytes32 _initialOriginChainID,
        address _initialSender,
        uint256 _nativeCoinAmount,
        string memory _tokenUri
    ) {
        // Initialize precompile contracts
        txAllowListPrecompile = IAllowList(_txAllowListPrecompileAddress);
        contractAllowListPrecompile = IAllowList(
            _contractAllowListPrecompileAddress
        );
        nativeMinterPrecompile = INativeMinter(_nativeMinterPrecompileAddress);

        // Initialize administrative state variables

        // Address of the teleporter messenger contract
        teleporterMessenger = _teleporterMessenger;

        // initialOriginChainID is the avalanche chainID of C-Chain
        //Allow C-Chain to call this contract
        allowedOriginChains[_initialOriginChainID] = true;

        // Address of the VeriFreeControl contract on C-Chain
        allowedSenders[_initialSender] = true;

        // Native coin amount is in wei, 1 VFT = 10^18 wei
        nativeCoinAmount = _nativeCoinAmount;

        // Initialize VSBT contract
        vsbt = new VerifiedStudentSBT(_tokenUri);
    }

    // This function is called by the TeleporterMessenger contract on the receiving chain
    function receiveTeleporterMessage(
        bytes32 originChainID,
        address originSenderAddress,
        bytes calldata message
    )
        external
        override
        onlyTeleporterMessenger
        onlyAllowedOriginChain(originChainID)
        onlyAllowedSender(originSenderAddress)
    {
        AccessInfo memory accessInfo = abi.decode(message, (AccessInfo));
        address _addressToUpdate = accessInfo.addressToUpdate;
        // Update the transaction allow list
        // If the address is allowed as admin, do setAdmin
        // If the address is allowed as non-admin, do setEnabled
        // If the address is neither, do setNone
        if (accessInfo.transactionsAdmin) {
            txAllowListPrecompile.setAdmin(_addressToUpdate);
        } else if (accessInfo.transactionsAllowed) {
            txAllowListPrecompile.setEnabled(_addressToUpdate);
        } else {
            txAllowListPrecompile.setNone(_addressToUpdate);
        }
        uint256 _updatedRole = txAllowListPrecompile.readAllowList(
            _addressToUpdate
        );
        emit TxAllowListUpdated(_addressToUpdate, _updatedRole);

        // Update the contract allow list
        // If the address is allowed as admin, do setAdmin
        // If the address is allowed as non-admin, do setEnabled
        // If the address is neither, do setNone
        if (accessInfo.contractsAdmin) {
            contractAllowListPrecompile.setAdmin(_addressToUpdate);
        } else if (accessInfo.contractsAllowed) {
            contractAllowListPrecompile.setEnabled(_addressToUpdate);
        } else {
            contractAllowListPrecompile.setNone(_addressToUpdate);
        }

        _updatedRole = contractAllowListPrecompile.readAllowList(
            _addressToUpdate
        );
        emit ContractAllowListUpdated(_addressToUpdate, _updatedRole);

        // Check updated addresses to avoid minting multiple times
        // This means VSBT and native tokens can only be minted once per address
        if (!updatedAddresses[_addressToUpdate]) {
            // Mint the native coin to the address
            // All addresses are minted the same amount for the first invocation
            updatedAddresses[_addressToUpdate] = true;
            nativeMinterPrecompile.mintNativeCoin(
                _addressToUpdate,
                nativeCoinAmount
            );
            emit NativeCoinMinted(_addressToUpdate, nativeCoinAmount);
        }
        // Mint VSBT if mintSubnetVSBT is true and the address is not already holding a VSBT
        if (
            accessInfo.mintSubnetVSBT && vsbt.balanceOf(_addressToUpdate) == 0
        ) {
            uint256 _tokenId = vsbt.mintVSBT(accessInfo.addressToUpdate);
            emit VSBTMinted(_addressToUpdate, _tokenId);
        }
    }

    // Admin functions, only callable by the owner of the contract to update allow lists and teleporter messenger
    function updateTeleporterMessenger(
        address _teleporterMessenger
    ) external onlyOwner {
        teleporterMessenger = _teleporterMessenger;
        emit TeleporterMessengerUpdated(_teleporterMessenger);
    }

    function updateAllowedOriginChain(
        bytes32 originChainID,
        bool allow
    ) external onlyOwner {
        allowedOriginChains[originChainID] = allow;
        emit AllowedOriginChainUpdated(originChainID, allow);
    }

    function updateAllowedSender(
        address sender,
        bool allow
    ) external onlyOwner {
        allowedSenders[sender] = allow;
        emit AllowedSenderUpdated(sender, allow);
    }

    function updateNativeCoinAmount(
        uint256 _nativeCoinAmount
    ) external onlyOwner {
        // Native coin amount is in wei, 1 VFT = 10^18 wei
        nativeCoinAmount = _nativeCoinAmount;
        emit NativeCoinAmountUpdated(_nativeCoinAmount);
    }
}
