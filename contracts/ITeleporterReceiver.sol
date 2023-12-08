//SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

/**
 * @dev Interface that cross-chain applications must implement to receive messages from Teleporter.
 */
interface ITeleporterReceiver {
    /**
     * @dev Called by TeleporterMessenger on the receiving chain.
     *
     * @param originChainID is provided by the TeleporterMessenger contract.
     * @param originSenderAddress is provided by the TeleporterMessenger contract.
     * @param message is the TeleporterMessage payload set by the sender.
     */
    function receiveTeleporterMessage(
        bytes32 originChainID,
        address originSenderAddress,
        bytes calldata message
    ) external;
}
