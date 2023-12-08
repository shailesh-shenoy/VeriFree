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

    event TeleporterMessengerUpdated(address newTeleporterMessenger);
    event AllowedOriginChainUpdated(bytes32 originChainID, bool allow);
    event AllowedSenderUpdated(address sender, bool allow);
    event NativeCoinAmountUpdated(uint256 nativeCoinAmount);

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

        // Update the transaction allow list
        // If the address is allowed as admin, do setAdmin
        // If the address is allowed as non-admin, do setEnabled
        // If the address is neither, do setNone
        if (accessInfo.transactionsAdmin) {
            txAllowListPrecompile.setAdmin(accessInfo.addressToUpdate);
        } else if (accessInfo.transactionsAllowed) {
            txAllowListPrecompile.setEnabled(accessInfo.addressToUpdate);
        } else {
            txAllowListPrecompile.setNone(accessInfo.addressToUpdate);
        }

        // Update the contract allow list
        // If the address is allowed as admin, do setAdmin
        // If the address is allowed as non-admin, do setEnabled
        // If the address is neither, do setNone
        if (accessInfo.contractsAdmin) {
            contractAllowListPrecompile.setAdmin(accessInfo.addressToUpdate);
        } else if (accessInfo.contractsAllowed) {
            contractAllowListPrecompile.setEnabled(accessInfo.addressToUpdate);
        } else {
            contractAllowListPrecompile.setNone(accessInfo.addressToUpdate);
        }
        // Check updated addresses to avoid minting multiple times
        // This means VSBT can only be minted once per address
        if (!updatedAddresses[accessInfo.addressToUpdate]) {
            // Mint the native coin to the address
            // All addresses are minted the same amount for the first invocation
            updatedAddresses[accessInfo.addressToUpdate] = true;
            nativeMinterPrecompile.mintNativeCoin(
                accessInfo.addressToUpdate,
                nativeCoinAmount
            );
            // Mint VSBT if mintSubnetVSBT is true
            if (accessInfo.mintSubnetVSBT) {
                vsbt.mintVSBT(accessInfo.addressToUpdate);
            }
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
