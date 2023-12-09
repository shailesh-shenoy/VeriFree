// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.16;

interface IVeriFreeControl {
    // Pseudo-Interface for VeriFree Control contract
    // This is not implemented by VeriFreeControl, but a pseudo-interface to allow the VeriFreeDAO contract
    // and DestinationVSBTMinter contracts to interact with the VeriFree Control contract.

    function updateSubnetAllowList(
        address _addressToUpdate,
        bool _transactionsAllowed,
        bool _transactionsAdmin,
        bool _contractsAllowed,
        bool _contractsAdmin,
        bool _mintSubnetVSBT
    ) external returns (bytes32);

    function addValidDomains(string memory _domain) external returns (bytes32);
}
