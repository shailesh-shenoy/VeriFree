// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.16;

import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {VerifiedStudentSBT} from "./VerifiedStudentSBT.sol";
import {IVeriFreeControl} from "./IVeriFreeControl.sol";

contract DestinationVSBTMinter is CCIPReceiver, Ownable {
    // State variable for the VSBT contract
    VerifiedStudentSBT public vsbt;

    // VeriFree Control contract address
    IVeriFreeControl public veriFreeControl;

    // Mapping to keep track of allowed source chains
    mapping(uint64 => bool) public allowListedSourceChains;

    // Mapping to keep track of allowed sender addresses on source chains
    mapping(address => bool) public allowListedSenders;

    // Event emitted upon initialization of the contract with given parameters.
    event ContractInitialized(
        address indexed _vsbtAddress,
        uint64 indexed _initialSourceChainSelector,
        address indexed _veriFreeControlAddress,
        string _tokenUri
    );

    // Event emitted when a source chain's allow status is updated.
    event SourceChainSelectorUpdated(
        uint64 indexed _sourceChainSelector,
        bool _allow
    );

    // Event emitted when a sender address' allow status is updated.
    event SenderUpdated(address indexed _senderAddress, bool _allow);

    // Event emitted when a CCIP message is received.
    event CCIPMessageReceived(
        bytes32 indexed _messageId,
        uint64 indexed _sourceChainSelector,
        address indexed _sender,
        bytes _data
    );

    // Event emitted when a new VSBT is minted.
    event MintCallSuccessful(
        address indexed _verifierAddress,
        address indexed _receiverAddress,
        uint256 _tokenId
    );

    // Event emitted when a request is sent to the VeriFree Control contract.
    event VeriFreeControlRequestSent(
        address indexed _verifierAddress,
        address indexed _addressToUpdate,
        bytes32 indexed _requestId,
        bool _transactionsAllowed,
        bool _transactionsAdmin,
        bool _contractsAllowed,
        bool _contractsAdmin,
        bool _mintSubnetVSBT
    );

    // Event emitted when the token URI for the VSBT contract is updated.
    event VSBTTokenUriUpdated(string _tokenUri);

    // Event emitted when the VeriFree Control contract address is updated.
    event VeriFreeControlAddressUpdated(address _veriFreeControlAddress);

    error SourceChainNotAllowlisted(uint64 sourceChainSelector);
    error SenderNotAllowlisted(address sender);

    /**
     * @dev Constructor: Initialize DestinationMinter contract
     * Deploy a new VerifiedStudentSBT contract with the tokenUri.
     * This VSBT contract will be owned by the DestinationMinter contract, and will only mint VSBTs upon receiving a valid CCIP message.
     * Override the parent constructors when initializing the contract.
     * @param _tokenUri The token URI for the VSBT contract.
     */
    constructor(
        address _router,
        uint64 _initialSourceChainSelector,
        address _veriFreeControlAddress,
        string memory _tokenUri
    ) CCIPReceiver(_router) {
        vsbt = new VerifiedStudentSBT(_tokenUri);
        veriFreeControl = IVeriFreeControl(_veriFreeControlAddress);
        // No senders are allowed by default.
        // Student Verifier on source chain will be added to allowListedSenders later.
        allowListedSourceChains[_initialSourceChainSelector] = true;
        emit ContractInitialized(
            address(vsbt),
            _initialSourceChainSelector,
            _veriFreeControlAddress,
            _tokenUri
        );
    }

    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal override {
        // Decode the sender address from the CCIP message sender. This should be the address of the StudentVerifier contract.
        address _verifierAddress = abi.decode(message.sender, (address));
        emit CCIPMessageReceived(
            message.messageId,
            message.sourceChainSelector,
            _verifierAddress,
            message.data
        );

        if (!allowListedSourceChains[message.sourceChainSelector]) {
            revert SourceChainNotAllowlisted(message.sourceChainSelector);
        }
        if (!allowListedSenders[_verifierAddress]) {
            revert SenderNotAllowlisted(_verifierAddress);
        }

        // Decode the receiver address from the CCIP message data. This will revert if the data is not a valid address.
        address _receiverAddress = abi.decode(message.data, (address));
        // Mint a new VSBT to the receiver address.
        uint256 _tokenId = vsbt.mintVSBT(_receiverAddress);
        emit MintCallSuccessful(_verifierAddress, _receiverAddress, _tokenId);

        // Allow receiver address on the VeriFree Subnet
        // by calling the VeriFree Control contract's updateAllowList function.
        // This will allow the receiver address to send transactions and deploy contracts on the VeriFree Subnet.

        bytes32 _requestId = veriFreeControl.updateSubnetAllowList(
            _receiverAddress,
            true, // transactionsAllowed
            false, // Not transactionsAdmin
            true, // contractsAllowed
            false, // Not contractsAdmin
            true // mintSubnetVSBT
        );

        emit VeriFreeControlRequestSent(
            _verifierAddress,
            _receiverAddress,
            _requestId,
            true,
            false,
            true,
            false,
            true
        );
    }

    /**
     * @dev Allow or deny a source chain to send CCIP messages.
     * @param _sourceChainSelector The source chain selector whose status is to be updated.
     * @param _allow Whether to allow or deny the source chain.
     */
    function updateSourceChainSelector(
        uint64 _sourceChainSelector,
        bool _allow
    ) external onlyOwner {
        allowListedSourceChains[_sourceChainSelector] = _allow;
        emit SourceChainSelectorUpdated(_sourceChainSelector, _allow);
    }

    /**
     * @dev Allow or deny a sender address to send CCIP messages.
     * @param _senderAddress The sender address whose status is to be updated.
     * @param _allow Whether to allow or deny the sender address.
     */
    function updateSender(
        address _senderAddress,
        bool _allow
    ) external onlyOwner {
        allowListedSenders[_senderAddress] = _allow;
        emit SenderUpdated(_senderAddress, _allow);
    }

    /**
     * @dev Update the VeriFree Control contract address.
     * @param _veriFreeControlAddress The new VeriFree Control contract address.
     */
    function updateVeriFreeControlAddress(
        address _veriFreeControlAddress
    ) external onlyOwner {
        veriFreeControl = IVeriFreeControl(_veriFreeControlAddress);
        emit VeriFreeControlAddressUpdated(_veriFreeControlAddress);
    }

    /**
     * @dev Update the token URI for the VSBT contract.
     * @param _tokenUri The new token URI.
     */
    function updateTokenUri(string memory _tokenUri) external onlyOwner {
        vsbt.updateTokenUri(_tokenUri);
        emit VSBTTokenUriUpdated(_tokenUri);
    }
}
