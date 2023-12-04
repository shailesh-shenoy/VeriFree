// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.16;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/libraries/FunctionsRequest.sol";

contract VeriFreeControl is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    // State variables required for Chainlink functions
    uint8 public donHostedSecretsSlotID;
    uint64 public donHostedSecretsVersion;
    uint64 public subscriptionId;
    bytes32 public donID;
    uint32 public gasLimit;
    string public validDomainsSourceJS;
    string public allowListSourceJS;

    // State variables for VeriFreeControl
    mapping(string => bool) public validDomains;
    mapping(address => SubnetAccess) public subnetAllowList;
    mapping(address => bool) public allowListedAdmins;

    // Modifiers
    modifier onlyAllowListedAdmins() {
        if (!allowListedAdmins[msg.sender]) {
            revert AddressNotAuthorized(msg.sender);
        }
        _;
    }

    // Struct for storing subnet access
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

    event ErrorResponseReceived(
        bytes32 indexed _requestId,
        bytes _response,
        bytes _err
    );

    event validDomainsUpdated(
        bytes32 indexed _requestId,
        bytes _response,
        bytes _err
    );

    event allowListUpdated(
        bytes32 indexed _requestId,
        bytes _response,
        bytes _err
    );

    event UnknownResponseReceived(
        bytes32 indexed _requestId,
        bytes _response,
        bytes _err
    );

    // Errors
    error AddressNotAuthorized(address _sender);

    /**
     * @notice Deploy the VeriFreeControl contract
     * @param _router The address of the Chainlink router
     * @param _donHostedSecretsSlotID The slot ID of the DON hosted secrets
     * @param _donHostedSecretsVersion The version of the DON hosted secrets
     * @param _subscriptionId The subscription ID of the Chainlink functions subscription
     * @param _donID The DON ID of the DON processing the Chainlink functions
     * @param _gasLimit The gas limit for the callback fulfill function
     * @param _validDomainsSourceJS The source JS for the validDomains function
     * @param _allowListSourceJS The source JS for the allowList function
     */
    constructor(
        address _router,
        uint8 _donHostedSecretsSlotID,
        uint64 _donHostedSecretsVersion,
        uint64 _subscriptionId,
        bytes32 _donID,
        uint32 _gasLimit,
        string _validDomainsSourceJS,
        string _allowListSourceJS
    ) FunctionsClient(router) ConfirmedOwner(msg.sender) {
        donHostedSecretsSlotID = _donHostedSecretsSlotID;
        donHostedSecretsVersion = _donHostedSecretsVersion;
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
    ) external onlyAllowListedAdmins returns (bytes32 requestId) {
        // Create the Chainlink request
        FunctionsRequest.Request memory req;
        // 1 argument sent to the Chainlink function: _domain to add to the valid domains list
        string[] memory args = new string[](1);
        args[0] = _domain;

        req.initializeRequestForInlineJavaScript(validDomainsSourceJS);
        req.addDONHostedSecrets(
            donHostedSecretsSlotID,
            donHostedSecretsVersion
        );
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
    ) external onlyAllowListedAdmins returns (bytes32 requestId) {
        // Create the Chainlink request
        FunctionsRequest.Request memory req;
        // 5 arguments sent to the Chainlink function:
        // _addressToUpdate: The address to update in the subnet allow list
        // _transactionsAllowed: Whether transactions are allowed for the address
        // _transactionsAdmin: Whether the address has admin access to transactions allow list
        // _contractsAllowed: Whether contract deployments are allowed for the address
        // _contractsAdmin: Whether the address has admin access to contracts allow list
        string[] memory args = new string[](5);
        args[0] = _addressToUpdate;
        args[1] = _transactionsAllowed;
        args[2] = _transactionsAdmin;
        args[3] = _contractsAllowed;
        args[4] = _contractsAdmin;

        req.initializeRequestForInlineJavaScript(allowListSourceJS);
        req.addDONHostedSecrets(
            donHostedSecretsSlotID,
            donHostedSecretsVersion
        );
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
            _contractsAdmin,
            false
        );
        return _requestId;
    }

    /**
     * @dev Callback function for Chainlink functions
     * @param requestId The request ID of the Chainlink function invocation
     * @param response The response of the Chainlink function invocation
     * @param err The error returned by the Chainlink function invocation
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (err.length > 0) {
            emit ErrorResponseReceived(requestId, response, err);
        }
        if (uint256(response) == 1) {
            // Response 1 means the request type is validDomains
            emit validDomainsUpdated(requestId, response, err);
        } else if (uint256(response) == 2) {
            // Response 2 means the request type is updateSubnetAllowList

            emit allowListUpdated(requestId, response, err);
        } else {
            emit UnknownResponseReceived(requestId, response, err);
        }
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
    ) external onlyAllowListedAdmins returns (bytes32 requestId) {
        allowListedAdmins[_admin] = _allowListed;
    }

    // Setter functions for updating state variables
    function updateDonHostedSecretsSlotID(
        uint8 _donHostedSecretsSlotID
    ) external onlyAllowListedAdmins {
        donHostedSecretsSlotID = _donHostedSecretsSlotID;
    }

    function updateDonHostedSecretsVersion(
        uint64 _donHostedSecretsVersion
    ) external onlyAllowListedAdmins {
        donHostedSecretsVersion = _donHostedSecretsVersion;
    }

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
}
