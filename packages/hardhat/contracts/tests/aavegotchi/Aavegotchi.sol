// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";
import {LibAavegotchi} from "./aavegotchi-contracts/contracts/Aavegotchi/libraries/LibAavegotchi.sol";
import {Aavegotchi as AavegotchiStruct, EQUIPPED_WEARABLE_SLOTS, NUMERIC_TRAITS_NUM} from "./aavegotchi-contracts/contracts/Aavegotchi/libraries/LibAppStorage.sol";

contract Aavegotchi is ERC721PresetMinterPauserAutoId {
    mapping(uint256 => AavegotchiStruct) aavegotchis;

    constructor() ERC721PresetMinterPauserAutoId("Aavegotchi", "GOTCHI", "") {}

    function mintWithTraits(address to) external {
        uint256 randomNumberN = uint256(keccak256(abi.encodePacked("0", "0")));
        int16[NUMERIC_TRAITS_NUM] memory collateralTypeInfo;
        collateralTypeInfo[0] = 1;
        collateralTypeInfo[1] = 1;
        collateralTypeInfo[2] = 1;
        collateralTypeInfo[3] = 1;
        collateralTypeInfo[4] = 1;
        collateralTypeInfo[5] = 1;

        aavegotchis[0].numericTraits = LibAavegotchi.toNumericTraits(
            randomNumberN,
            collateralTypeInfo,
            0
        );

        mint(to);
    }

    function getNumericTraits(uint256 _tokenId)
        external
        view
        returns (int16[NUMERIC_TRAITS_NUM] memory numericTraits_)
    {
        //Check if trait boosts from consumables are still valid
        int256 boostDecay = int256(
            (block.timestamp - aavegotchis[_tokenId].lastTemporaryBoost) /
                24 hours
        );
        for (uint256 i; i < NUMERIC_TRAITS_NUM; i++) {
            int256 number = aavegotchis[_tokenId].numericTraits[i];
            int256 boost = aavegotchis[_tokenId].temporaryTraitBoosts[i];

            if (boost > 0 && boost > boostDecay) {
                number += boost - boostDecay;
            } else if ((boost * -1) > boostDecay) {
                number += boost + boostDecay;
            }
            numericTraits_[i] = int16(number);
        }
    }
}
