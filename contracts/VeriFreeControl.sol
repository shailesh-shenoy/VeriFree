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
    bytes public encryptedSecretsReference; // Needs to be updated as the secrets expire
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

    // Struct for storing subnet access
    // This data will be synced off-chain to the VeriFree subnet
    // Future implementations will use the AWM standard for cross-chain communication
    struct SubnetAccess {
        bool transactionsAllowed;
        bool transactionsAdmin;
        bool contractsAllowed;
        bool contractsAdmin;
    }

    // Events
    event validDomainsFunctionInvoked(
        bytes32 indexed _requestId,
        string _domain
    );

    event updateSubnetAllowListFunctionInvoked(
        bytes32 indexed _requestId,
        address _addressToUpdate,
        bool _transactionsAllowed,
        bool _transactionsAdmin,
        bool _contractsAllowed,
        bool _contractsAdmin
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
     * @param _encryptedSecretsReference The encrypted secrets reference for the Chainlink functions
     * @param _subscriptionId The subscription ID of the Chainlink functions subscription
     * @param _donID The DON ID of the DON processing the Chainlink functions
     * @param _gasLimit The gas limit for the callback fulfill function
     * @param _validDomainsSourceJS The source JS for the validDomains function
     * @param _allowListSourceJS The source JS for the allowList function
     */
    constructor(
        address _router,
        bytes memory _encryptedSecretsReference,
        uint64 _subscriptionId,
        bytes32 _donID,
        uint32 _gasLimit,
        string memory _validDomainsSourceJS,
        string memory _allowListSourceJS
    ) FunctionsClient(_router) ConfirmedOwner(msg.sender) {
        // Update with initial values to call chainlink functions
        // Can be updated later with the setters by thee allow listed addresses
        encryptedSecretsReference = _encryptedSecretsReference;
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
        req.secretsLocation = FunctionsRequest.Location.DONHosted;
        req.encryptedSecretsReference = encryptedSecretsReference;

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
        bool _contractsAdmin
    ) external onlyAllowListedAdmins returns (bytes32) {
        // Create the Chainlink request
        FunctionsRequest.Request memory req;
        // 5 arguments sent to the Chainlink function:
        // _addressToUpdate: The address to update in the subnet allow list
        // _transactionsAllowed: Whether transactions are allowed for the address
        // _transactionsAdmin: Whether the address has admin access to transactions allow list
        // _contractsAllowed: Whether contract deployments are allowed for the address
        // _contractsAdmin: Whether the address has admin access to contracts allow list
        string[] memory args = new string[](5);
        args[0] = addressToString(_addressToUpdate);
        args[1] = boolToString(_transactionsAllowed);
        args[2] = boolToString(_transactionsAdmin);
        args[3] = boolToString(_contractsAllowed);
        args[4] = boolToString(_contractsAdmin);

        req.initializeRequestForInlineJavaScript(allowListSourceJS);
        req.secretsLocation = FunctionsRequest.Location.DONHosted;
        req.encryptedSecretsReference = encryptedSecretsReference;
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
            _contractsAdmin
        );

        subnetAllowList[_addressToUpdate] = SubnetAccess(
            _transactionsAllowed,
            _transactionsAdmin,
            _contractsAllowed,
            _contractsAdmin
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

    // This update will be required as the secrets expire
    function updateEncryptedSecretsReference(
        bytes memory _encryptedSecretsReference
    ) external onlyAllowListedAdmins {
        encryptedSecretsReference = _encryptedSecretsReference;
    }

    // Helper functions - Coversions
    function boolToString(bool _bool) private pure returns (string memory) {
        if (_bool) {
            return "true";
        } else {
            return "false";
        }
    }

    /**
     * @dev Convert an address to a string
     * converted address is lowercase and does not have the 0x prefix
     * @param x The address to convert to a string
     * @return s The string representation of the address
     */
    function addressToString(address x) private pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2 ** (8 * (19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2 * i] = char(hi);
            s[2 * i + 1] = char(lo);
        }
        return string(s);
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}
