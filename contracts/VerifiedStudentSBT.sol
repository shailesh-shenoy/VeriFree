// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.19;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import {ERC721Votes} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

contract VerifiedStudentSBT is ERC721, Ownable, EIP712, ERC721Votes {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    string public tokenUri;

    /**
     * @dev Constructor: initialize VSBT contract
     * Set the token URI for the contract.
     * This token URI will return the same metadata for all SBTs.
     * Override the parent constructors when initializing the contract.
     * @param _tokenUri The token URI for the contract
     */

    constructor(
        string memory _tokenUri
    ) ERC721("VerifiedStudentSBT", "VSBT") EIP712("VerifiedStudentSBT", "1") {
        tokenUri = _tokenUri;
    }

    /**
     * @dev Mint function: mint a new SBT
     * Can only be called by the owner of the contract.
     * i.e. the DestinationVSBTMinter contract.
     * This ensures that VSBTs are only issued to student address verified on the Polygon network
     * using the StudentVerifier contract and sent through CCIP.
     * @param _to The address of the student to mint the SBT to
     * @return _tokenId The token ID of the minted VSBT
     */
    function mintVSBT(address _to) public onlyOwner returns (uint256) {
        uint256 _tokenId = _tokenIdCounter.current();
        _safeMint(_to, _tokenId);
        _tokenIdCounter.increment();
        return _tokenId;
    }

    /**
     * @dev Ovverride the standard tokenUri function to return the same metadata/image for all VSBT holders.
     * @param tokenId The token ID of the VSBT
     */
    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
        return tokenUri;
    }

    /**
     * @dev Update the token URI for the contract.
     * Can only be called by the owner of the contract.
     * @param _tokenUri The new token URI for the contract
     */
    function updateTokenUri(string memory _tokenUri) public onlyOwner {
        tokenUri = _tokenUri;
    }

    /**
     * @dev Override the _beforeTokenTransfer hook to make the token soul bound to the holder address.
     *
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721) {
        require(
            from == address(0) || to == address(0),
            "ERC721: Token is soul bound to the holder address."
        );
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @dev Override the _afterTokenTransfer hook as required by the parent contracts.
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Votes) {
        super._afterTokenTransfer(from, to, tokenId, batchSize);
    }
}
