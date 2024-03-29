// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.16;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/libraries/FunctionsRequest.sol";

contract VeriFreeControl is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    // State variables required for Chainlink functions
    uint64 public subscriptionId;
    bytes32 public donID;
    bytes public encryptedSecretsURL; // Off-chain reference to the encrypted secrets
    uint32 public gasLimit;
    string public validDomainsSourceJS;
    string public allowListSourceJS;

    // State variables for VeriFreeControl
    mapping(string => bool) public validDomains;
    mapping(address => SubnetAccess) public subnetAllowList;
    mapping(address => bool) public allowListedAdmins;

    // Modifiers
    // Only allow listed addresses can call the functions marked with this modifier
    modifier onlyAllowListedAdmins() {
        if (!allowListedAdmins[msg.sender]) {
            revert AddressNotAuthorized(msg.sender);
        }
        _;
    }

    // Struct for storing subnet access on-chain
    // This data will be synced off-chain to the VeriFree subnet
    // Future implementations will use the AWM standard for cross-chain communication
    struct SubnetAccess {
        bool transactionsAllowed;
        bool transactionsAdmin;
        bool contractsAllowed;
        bool contractsAdmin;
        bool mintSubnetVSBT;
    }

    // Struct to encode/decode the allowlist_message.
    struct AccessInfo {
        address addressToUpdate;
        bool transactionsAllowed;
        bool transactionsAdmin;
        bool contractsAllowed;
        bool contractsAdmin;
        bool mintSubnetVSBT;
    }

    // Events
    event validDomainsFunctionInvoked(
        bytes32 indexed _requestId,
        string _domain
    );

    event updateSubnetAllowListFunctionInvoked(
        bytes32 indexed _requestId,
        address indexed _addressToUpdate,
        bool _transactionsAllowed,
        bool _transactionsAdmin,
        bool _contractsAllowed,
        bool _contractsAdmin,
        bool _mintSubnetVSBT
    );

    event ResponseReceived(
        bytes32 indexed _requestId,
        bytes _response,
        bytes _err
    );

    // Errors
    error AddressNotAuthorized(address _sender);

    /**
     * @notice Deploy the VeriFreeControl contract
     * @param _router The address of the Chainlink router
     * @param _encryptedSecretsURL The encrypted secrets reference for the Chainlink functions
     * @param _subscriptionId The subscription ID of the Chainlink functions subscription
     * @param _donID The DON ID of the DON processing the Chainlink functions
     * @param _gasLimit The gas limit for the callback fulfill function
     * @param _validDomainsSourceJS The source JS for the validDomains function
     * @param _allowListSourceJS The source JS for the allowList function
     */
    constructor(
        address _router,
        bytes memory _encryptedSecretsURL,
        uint64 _subscriptionId,
        bytes32 _donID,
        uint32 _gasLimit,
        string memory _validDomainsSourceJS,
        string memory _allowListSourceJS
    ) FunctionsClient(_router) ConfirmedOwner(msg.sender) {
        // Update with initial values to call chainlink functions
        // Can be updated later with the setters by thee allow listed addresses
        encryptedSecretsURL = _encryptedSecretsURL;
        subscriptionId = _subscriptionId;
        donID = _donID;
        gasLimit = _gasLimit;
        validDomainsSourceJS = _validDomainsSourceJS;
        allowListSourceJS = _allowListSourceJS;
        allowListedAdmins[msg.sender] = true;
    }

    /**
     * @dev Add a domain to the valid domains list
     * Can only be called by an allow listed admin
     * Calls the validDomains Chainlink function
     * @param _domain The domain to add to the valid domains list
     * @return requestId The request ID of the Chainlink function invocation
     */
    function addValidDomains(
        string memory _domain
    ) external onlyAllowListedAdmins returns (bytes32) {
        // Create the Chainlink request
        FunctionsRequest.Request memory req;
        // 1 argument sent to the Chainlink function: _domain to add to the valid domains list
        string[] memory args = new string[](1);
        args[0] = _domain;

        req.initializeRequestForInlineJavaScript(validDomainsSourceJS);
        req.addSecretsReference(encryptedSecretsURL);

        req.setArgs(args);
        bytes32 _requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donID
        );

        emit validDomainsFunctionInvoked(_requestId, _domain);
        return _requestId;
    }

    /**
     * @dev Updates the subnet allow list
     * Can only be called by an allow listed admin
     * Calls the updateSubnetAllowList Chainlink function, updating access to the VeriFree subnet
     * @param _addressToUpdate The address to update in the subnet allow list
     * @param _transactionsAllowed Whether transactions are allowed for the address
     * @param _transactionsAdmin Whether transactions are admin for the address
     * @param _contractsAllowed Whether contracts are allowed for the address
     * @param _contractsAdmin Whether contracts are admin for the address
     * @return requestId The request ID of the Chainlink function invocation
     */
    function updateSubnetAllowList(
        address _addressToUpdate,
        bool _transactionsAllowed,
        bool _transactionsAdmin,
        bool _contractsAllowed,
        bool _contractsAdmin,
        bool _mintSubnetVSBT
    ) external onlyAllowListedAdmins returns (bytes32) {
        // Create the Chainlink request
        FunctionsRequest.Request memory req;
        //Encode the arguments to bytes and convert to string
        //This message will be unique and decoded on the receiving VeriFree subnet contract
        string memory _message = bytesToHexString(
            abi.encode(
                AccessInfo({
                    addressToUpdate: _addressToUpdate,
                    transactionsAllowed: _transactionsAllowed,
                    transactionsAdmin: _transactionsAdmin,
                    contractsAllowed: _contractsAllowed,
                    contractsAdmin: _contractsAdmin,
                    mintSubnetVSBT: _mintSubnetVSBT
                })
            )
        );
        // 1 argument sent to the Chainlink function: _message to update the subnet allow list
        // This implementation mimics the teleporter messenger as a Chainlink function
        // The destination chainID and destination address are not needed for this implementation
        // But will be needed for future implementations using the AWM standard
        string[] memory args = new string[](1);
        args[0] = _message;

        req.initializeRequestForInlineJavaScript(allowListSourceJS);
        req.addSecretsReference(encryptedSecretsURL);
        req.setArgs(args);
        bytes32 _requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donID
        );

        emit updateSubnetAllowListFunctionInvoked(
            _requestId,
            _addressToUpdate,
            _transactionsAllowed,
            _transactionsAdmin,
            _contractsAllowed,
            _contractsAdmin,
            _mintSubnetVSBT
        );

        subnetAllowList[_addressToUpdate] = SubnetAccess(
            _transactionsAllowed,
            _transactionsAdmin,
            _contractsAllowed,
            _contractsAdmin,
            _mintSubnetVSBT
        );

        return _requestId;
    }

    /**
     * @dev Callback function for Chainlink functions
     * Emits a ResponseReceived event with the requestId, response and error
     * @param requestId The request ID of the Chainlink function invocation
     * @param response The response of the Chainlink function invocation
     * @param err The error returned by the Chainlink function invocation
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        emit ResponseReceived(requestId, response, err);
    }

    /**
     * @dev Update the allow listed admins
     * Can only be called by an allow listed admin
     * @param _admin The address of the admin to update
     * @param _allowListed Whether the admin is allow listed
     */
    function updateAllowListedAdmins(
        address _admin,
        bool _allowListed
    ) external onlyAllowListedAdmins {
        allowListedAdmins[_admin] = _allowListed;
    }

    // Setters for updating state variables

    function updateSubscriptionId(
        uint64 _subscriptionId
    ) external onlyAllowListedAdmins {
        subscriptionId = _subscriptionId;
    }

    function updateDonID(bytes32 _donID) external onlyAllowListedAdmins {
        donID = _donID;
    }

    function updateGasLimit(uint32 _gasLimit) external onlyAllowListedAdmins {
        gasLimit = _gasLimit;
    }

    function updateValidDomainsSourceJS(
        string memory _validDomainsSourceJS
    ) external onlyAllowListedAdmins {
        validDomainsSourceJS = _validDomainsSourceJS;
    }

    function updateAllowListSourceJS(
        string memory _allowListSourceJS
    ) external onlyAllowListedAdmins {
        allowListSourceJS = _allowListSourceJS;
    }

    // This is the encrypted secrets reference for the Chainlink functions, stored off-chain
    function updateEncryptedSecretsURL(
        bytes memory _encryptedSecretsURL
    ) external onlyAllowListedAdmins {
        encryptedSecretsURL = _encryptedSecretsURL;
    }

    // Helper functions

    /**
     * @dev Convert bytes to hex string
     * Intended to be used to convert the allow list message to hex string as required by the Chainlink function
     * @param _bytes The bytes to convert to hex string
     * @return The hex string
     */

    function bytesToHexString(
        bytes memory _bytes
    ) internal pure returns (string memory) {
        bytes16 alphabet = "0123456789abcdef";
        bytes memory str = new bytes(2 + _bytes.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < _bytes.length; i++) {
            str[2 + i * 2] = alphabet[uint8(_bytes[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(_bytes[i] & 0x0f)];
        }
        return string(str);
    }
}
