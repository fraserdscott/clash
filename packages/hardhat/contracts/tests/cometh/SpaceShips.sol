// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "./ERC721PresetMinterPauser.sol";

// Does this need to be presetminterpauser
contract SpaceShips is ERC721PresetMinterPauser {
    mapping(uint256 => uint256) public nextId;
    mapping(uint256 => uint256) public supply;

    uint32 public constant ID_TO_MODEL = 1000000;
    event NewModel(uint256 id, uint256 maxSupply);

    constructor()
        ERC721PresetMinterPauser(
            "cometh spaceships",
            "SPACESHIP",
            "https://nft.service.cometh.io/"
        )
    {}

    function newModel(uint256 id, uint256 maxSupply) external onlyOwner {
        require(maxSupply <= ID_TO_MODEL, "SpaceShips: max supply too high");
        require(supply[id] == 0, "SpaceShips: model already exist");

        supply[id] = maxSupply;
        emit NewModel(id, maxSupply);
    }

    function mint(address to, uint256 model) public {
        require(supply[model] != 0, "SpaceShips: does not exist");
        require(nextId[model] < supply[model], "SpaceShips: sold out");
        uint256 tokenId = model * ID_TO_MODEL + nextId[model];
        nextId[model]++;
        safeMint(to, tokenId);
    }
}
