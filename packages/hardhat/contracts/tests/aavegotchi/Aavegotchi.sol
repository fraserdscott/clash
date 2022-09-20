// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";

uint256 constant EQUIPPED_WEARABLE_SLOTS = 16;
uint256 constant NUMERIC_TRAITS_NUM = 6;

struct AavegotchiStruct {
    uint16[EQUIPPED_WEARABLE_SLOTS] equippedWearables; //The currently equipped wearables of the Aavegotchi
    // [Experience, Rarity Score, Kinship, Eye Color, Eye Shape, Brain Size, Spookiness, Aggressiveness, Energy]
    int8[NUMERIC_TRAITS_NUM] temporaryTraitBoosts;
    int16[NUMERIC_TRAITS_NUM] numericTraits; // Sixteen 16 bit ints.  [Eye Color, Eye Shape, Brain Size, Spookiness, Aggressiveness, Energy]
    string name;
    uint256 randomNumber;
    uint256 experience; //How much XP this Aavegotchi has accrued. Begins at 0.
    uint256 minimumStake; //The minimum amount of collateral that must be staked. Set upon creation.
    uint256 usedSkillPoints; //The number of skill points this aavegotchi has already used
    uint256 interactionCount; //How many times the owner of this Aavegotchi has interacted with it.
    address collateralType;
    uint40 claimTime; //The block timestamp when this Aavegotchi was claimed
    uint40 lastTemporaryBoost;
    uint16 hauntId;
    address owner;
    uint8 status; // 0 == portal, 1 == VRF_PENDING, 2 == open portal, 3 == Aavegotchi
    uint40 lastInteracted; //The last time this Aavegotchi was interacted with
    bool locked;
    address escrow; //The escrow address this Aavegotchi manages.
}

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

        aavegotchis[0].numericTraits = toNumericTraits(
            randomNumberN,
            collateralTypeInfo,
            0
        );

        mint(to);
    }

    function toNumericTraits(
        uint256 _randomNumber,
        int16[NUMERIC_TRAITS_NUM] memory _modifiers,
        uint256 _hauntId
    ) internal pure returns (int16[NUMERIC_TRAITS_NUM] memory numericTraits_) {
        if (_hauntId == 1) {
            for (uint256 i; i < NUMERIC_TRAITS_NUM; i++) {
                uint256 value = uint8(uint256(_randomNumber >> (i * 8)));
                if (value > 99) {
                    value /= 2;
                    if (value > 99) {
                        value =
                            uint256(
                                keccak256(abi.encodePacked(_randomNumber, i))
                            ) %
                            100;
                    }
                }
                numericTraits_[i] = int16(int256(value)) + _modifiers[i];
            }
        } else {
            for (uint256 i; i < NUMERIC_TRAITS_NUM; i++) {
                uint256 value = uint8(uint256(_randomNumber >> (i * 8)));
                if (value > 99) {
                    value = value - 100;
                    if (value > 99) {
                        value =
                            uint256(
                                keccak256(abi.encodePacked(_randomNumber, i))
                            ) %
                            100;
                    }
                }
                numericTraits_[i] = int16(int256(value)) + _modifiers[i];
            }
        }
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
