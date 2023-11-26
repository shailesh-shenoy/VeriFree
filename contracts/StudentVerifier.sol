// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {GenesisUtils} from "@iden3/contracts/lib/GenesisUtils.sol";
import {ICircuitValidator} from "@iden3/contracts/interfaces/ICircuitValidator.sol";
import {ZKPVerifier} from "./ZKPVerifier.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";

contract StudentVerifier is ZKPVerifier {
    uint64 public constant TRANSFER_REQUEST_ID = 1;
    address public immutable routerAddress;
    uint64 public immutable destinationChainSelector;
    address public immutable receiverAddress;
    address public immutable linkAddress;

    mapping(uint256 => address) public idToAddress;
    mapping(address => uint256) public addressToId;

    event ProofVerificationRequested(address indexed _sender, uint256 _value);
    event ProofVerified(address indexed _sender, uint256 _id);

    error MessageSenderNotInProof(address _sender);
    error ProofAlreadySubmitted(address _sender, uint256 _id);

    constructor(
        address _routerAddress,
        uint64 _destinationChainSelector,
        address _receiverAddress,
        address _linkAddress
    ) {
        routerAddress = _routerAddress;
        destinationChainSelector = _destinationChainSelector;
        receiverAddress = _receiverAddress;
        linkAddress = _linkAddress;
    }

    function _beforeProofSubmit(
        uint64 /* requestId */,
        uint256[] memory inputs,
        ICircuitValidator validator
    ) internal override {
        // Check that challenge input is address of sender and revert if not.
        address _addr = GenesisUtils.int256ToAddress(
            inputs[validator.getChallengeInputIndex()]
        );
        if (_msgSender() != _addr) {
            revert MessageSenderNotInProof(_msgSender());
        }
        // Set the value to check in proof to sender's address
        // Get the last 15 digits of sender's address after converting to uint256
        // This ensures that the proof is not reused by another address.
        uint256 _dynamicValue = uint256(uint160(_msgSender())) % 10 ** 15;

        _setDynamicValue(TRANSFER_REQUEST_ID, dynamicValue);
        emit ProofVerificationRequested(_msgSender(), _dynamicValue);
    }

    function _afterProofSubmit(
        uint64 requestId,
        uint256[] memory inputs,
        ICircuitValidator /* validator */
    ) internal override {
        // Get user id from proof
        uint256 _id = inputs[1];
        // Check that the request id is TRANSFER_REQUEST_ID and that the sender has not already submitted a proof.
        if (
            requestId != TRANSFER_REQUEST_ID ||
            addressToId[_msgSender()] != 0 ||
            idToAddress[id] != address(0)
        ) {
            revert(ProofAlreadySubmitted(_msgSender(), _id));
        }

        emit ProofVerified(_msgSender(), _id);
        // additional check didn't get airdrop tokens before
    }

    /**
     * @dev Send a CCIP message to the destination chain to mint a VSBT.
     * This function is only called after the proof has been verified.
     * The CCIP message contains the address of the receiver of the VSBT.
     * This ensures that VSBTs are only issued to student address verified in this contract.
     */
    function _sendVerificationToDestinationChain() internal {
        IRouterClient _router = IRouterClient(routerAddress);
    }
}
