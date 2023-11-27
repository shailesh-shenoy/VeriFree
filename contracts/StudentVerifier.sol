// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {PrimitiveTypeUtils} from "@iden3/contracts/lib/PrimitiveTypeUtils.sol";
import {PoseidonFacade} from "@iden3/contracts/lib/Poseidon.sol";
import {ICircuitValidator} from "@iden3/contracts/interfaces/ICircuitValidator.sol";
import {ZKPVerifier} from "@iden3/contracts/verifiers/ZKPVerifier.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.0/token/ERC20/IERC20.sol";

contract StudentVerifier is ZKPVerifier {
    uint64 public constant TRANSFER_REQUEST_ID = 1;
    address public immutable routerAddress;
    uint64 public immutable destinationChainSelector;
    address public immutable receiverAddress;
    IERC20 public immutable linkToken;

    mapping(uint256 => address) public idToAddress;
    mapping(address => uint256) public addressToId;

    // Stuct to decode and modify value in ZKPRequest
    struct CredentialAtomicQuery {
        uint256 schema;
        uint256 claimPathKey;
        uint256 operator;
        uint256 slotIndex;
        uint256[] value;
        uint256 queryHash;
        uint256[] allowedIssuers;
        string[] circuitIds;
        bool skipClaimRevocationCheck;
        // 0 for inclusion in merklized credentials, 1 for non-inclusion and for non-merklized credentials
        uint256 claimPathNotExists;
    }

    event ProofVerificationRequested(address indexed _sender, uint256 _value);
    event ProofVerified(address indexed _sender, uint256 _id);
    event VerificationMessageSent(
        bytes32 indexed _messageId,
        uint64 indexed _destinationChainSelector,
        address indexed _receiverAddress,
        address _verifiedAddress
    );

    error MessageSenderNotInProof(address _sender);
    error ProofAlreadySubmitted(address _sender, uint256 _id);
    error InsufficientLinkBalance(
        uint256 _currentBalance,
        uint256 _calculateFee
    );

    constructor(
        address _routerAddress,
        uint64 _destinationChainSelector,
        address _receiverAddress,
        address _linkAddress
    ) {
        routerAddress = _routerAddress;
        destinationChainSelector = _destinationChainSelector;
        receiverAddress = _receiverAddress;
        linkToken = IERC20(_linkAddress);
    }

    /**
     * @dev Hook called before proof is submitted.
     * Modify the value in ZKPRequest set in the contract before.
     */
    function _beforeProofSubmit(
        uint64 /* requestId */,
        uint256[] memory inputs,
        ICircuitValidator validator
    ) internal override {
        // check that  challenge input is address of sender and revert otherwise.
        address addr = PrimitiveTypeUtils.int256ToAddress(
            inputs[validator.inputIndexOf("challenge")]
        );
        // this is linking between msg.sender and
        if (_msgSender() != addr) {
            revert MessageSenderNotInProof(_msgSender());
        }

        // Set the value to check in proof to sender's address
        // Get the last 15 digits of sender's address after converting to uint256
        // This ensures that the proof is not reused by another address.
        uint256 _dynamicValue = uint256(uint160(_msgSender())) % 10 ** 15;

        _setDynamicValue(_dynamicValue);
        emit ProofVerificationRequested(_msgSender(), _dynamicValue);
    }

    /**
     * @dev Set the value in ZKPRequest to the provided _dynamicValue.
     * This function is called by _beforeProofSubmit.
     */
    function _setDynamicValue(uint256 _dynamicValue) private {
        CredentialAtomicQuery memory credentialData = abi.decode(
            _requests[TRANSFER_REQUEST_ID].data,
            (CredentialAtomicQuery)
        );
        credentialData.value[0] = _dynamicValue;
        uint256 valueHash = PoseidonFacade.poseidonSponge(credentialData.value);
        uint256 queryHash = PoseidonFacade.poseidon6(
            [
                credentialData.schema,
                credentialData.slotIndex,
                credentialData.operator,
                credentialData.claimPathKey,
                credentialData.claimPathNotExists,
                valueHash
            ]
        );
        credentialData.queryHash = queryHash;
        _requests[TRANSFER_REQUEST_ID].data = abi.encode(credentialData);
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
            idToAddress[_id] != address(0)
        ) {
            revert ProofAlreadySubmitted(_msgSender(), _id);
        }

        emit ProofVerified(_msgSender(), _id);
        _sendVerificationToDestinationChain(_msgSender());
    }

    /**
     * @dev Send a CCIP message to the destination chain to mint a VSBT.
     * This function is only called after the proof has been verified.
     * The CCIP message contains the address of the receiver of the VSBT.
     * The CCIP fee is paid by the contract using LINK token.
     * This ensures that VSBTs are only issued to student address verified in this contract.
     */
    function _sendVerificationToDestinationChain(
        address _verifiedAddress
    ) private {
        // Build the CCIP message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiverAddress),
            data: abi.encode(_verifiedAddress),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000, strict: false})
            ),
            // Set the feeToken to a feeTokenAddress, indicating specific asset will be used for fees
            feeToken: address(linkToken)
        });
        // Initialize the router and get the fee required to send the message.
        // Revert if the current LINK balance is less than the fee.
        IRouterClient _router = IRouterClient(routerAddress);

        uint256 fees = _router.getFee(destinationChainSelector, message);
        if (fees > linkToken.balanceOf(address(this))) {
            revert InsufficientLinkBalance(
                linkToken.balanceOf(address(this)),
                fees
            );
        }

        // Approve the router to spend the LINK fee.
        linkToken.approve(routerAddress, fees);

        // Send the CCIP message through the router and return the messageId.
        bytes32 messageId = _router.ccipSend(destinationChainSelector, message);

        emit VerificationMessageSent(
            messageId,
            destinationChainSelector,
            receiverAddress,
            _msgSender()
        );
    }
}
