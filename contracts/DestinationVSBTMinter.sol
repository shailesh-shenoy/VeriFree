// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.16;

import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {VerifiedStudentSBT} from "./VerifiedStudentSBT.sol";

contract DestinationVSBTMinter is CCIPReceiver, Ownable {
    VerifiedStudentSBT public vsbt;

    // Mapping to keep track of allowed source chains
    mapping(uint64 => bool) public allowListedSourceChains;

    // Mapping to keep track of allowed sender addresses on source chains
    mapping(address => bool) public allowListedSenders;

    // Event emitted upon initialization of the contract with given parameters.
    event ContractInitialized(
        address indexed _vsbtAddress,
        uint64 indexed _initialSourceChainSelector,
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
        string memory _tokenUri
    ) CCIPReceiver(_router) {
        vsbt = new VerifiedStudentSBT(_tokenUri);
        allowListedSourceChains[_initialSourceChainSelector] = true;
        emit ContractInitialized(
            address(vsbt),
            _initialSourceChainSelector,
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
}
