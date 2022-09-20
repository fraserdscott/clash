const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");
const { BigNumber } = require("ethers");
const snarkjs = require("snarkjs");

use(solidity);

const INPUT = {
  homeStats: [15, 100, 5, 100],
  awayStats: [45, 31, 56, 91],
  rand: 2,
};

const COMETH_SUPPLY = 75;
const GOTCHI_SUPPLY = 100;

describe("Testing resolvers", function () {
  describe("Testing Battler with Cometh and Aavegotchi", function () {
    let owner;
    let battler;
    let cometh;
    let gotchi;
    let comethResolver;
    let gotchiResolver;

    it("Should deploy contracts", async function () {
      [owner] = await ethers.getSigners();

      /* Cometh Setup */
      const ShipsFactory = await ethers.getContractFactory("SpaceShips");
      const SpaceShipsRulesFactory = await ethers.getContractFactory(
        "SpaceShipsRules"
      );
      const MiningManagerFactory = await ethers.getContractFactory(
        "MiningManagerV4"
      );

      cometh = await ShipsFactory.deploy();
      cometh.newModel(1, COMETH_SUPPLY);

      const rules = await SpaceShipsRulesFactory.deploy();
      await rules.makeRule(1, 100, 0, 0, 0);

      const miningManager = await MiningManagerFactory.deploy(rules.address);

      /* Aavegotchi Setup */
      const GotchiFactory = await ethers.getContractFactory("Aavegotchi");

      gotchi = await GotchiFactory.deploy();

      const ComethResolverFactory = await ethers.getContractFactory(
        "ComethResolver"
      );
      const GotchiResolverFactory = await ethers.getContractFactory(
        "AavegotchiResolver"
      );
      const VerifierFactory = await ethers.getContractFactory("PlonkVerifier");
      const BattlerFactory = await ethers.getContractFactory("Battler");

      comethResolver = await ComethResolverFactory.deploy(
        miningManager.address
      );
      gotchiResolver = await GotchiResolverFactory.deploy(gotchi.address);

      const verifier = await VerifierFactory.deploy();
      battler = await BattlerFactory.deploy(
        300,
        1,
        verifier.address,
        [COMETH_SUPPLY, GOTCHI_SUPPLY],
        [comethResolver.address, gotchiResolver.address],
        [cometh.address, gotchi.address]
      );

      for (let i = 0; i < COMETH_SUPPLY; i += 1) {
        cometh.mint(owner.address, 1);
      }

      for (let i = 0; i < GOTCHI_SUPPLY; i += 1) {
        gotchi.mintWithTraits(owner.address);
      }
    });

    it("tokenByIndex should work", async function () {
      expect(await cometh.tokenByIndex(73)).to.deep.equal(1000073);
    });

    it("Should return the correct stats 0", async function () {
      expect(await comethResolver.tokenStats(1000073)).to.deep.equal([
        BigNumber.from(15),
        BigNumber.from(100),
        BigNumber.from(5),
        BigNumber.from(100),
      ]);
    });

    it("Should return the correct stats 0", async function () {
      expect(await gotchiResolver.tokenStats(0)).to.deep.equal([
        BigNumber.from(45),
        BigNumber.from(31),
        BigNumber.from(56),
        BigNumber.from(91),
      ]);
    });

    it("Should not allow battling before epoch simulated", async function () {
      await expect(
        battler.battle(gotchi.address, gotchi.address, 0, 1, 0, 0, "0x")
      ).to.be.revertedWith("This epochId has not been simulated yet");
    });

    it("Should allow simulating epochs", async function () {
      await expect(battler.simulateEpoch(0, 2))
        .to.emit(battler, "EpochSimulated")
        .withArgs(0, 2);
    });

    it("Should not allow battling tokens that are not matched", async function () {
      await expect(
        battler.battle(gotchi.address, gotchi.address, 0, 1, 0, 0, "0x")
      ).to.be.revertedWith("The given tokens are not matched in this epochId.");
    });

    it("Should not allow battling two cometh tokens without a valid proof", async function () {
      await expect(
        battler.battle(cometh.address, cometh.address, 0, 2, 0, 0, "0x")
      ).to.be.revertedWith("Invalid proof.");
    });

    it("Should not allow battling a cometh and orc token without a valid proof ", async function () {
      await expect(
        battler.battle(cometh.address, gotchi.address, 73, 0, 0, 0, "0x")
      ).to.be.revertedWith("Invalid proof.");
    });

    it("Should not allow battling tokens with the wrong winner value", async function () {
      const { proof, publicSignals } = await snarkjs.plonk.fullProve(
        INPUT,
        "./artifacts/circom/battle.wasm",
        "./artifacts/circom/battle.zkey"
      );

      const S = await snarkjs.plonk.exportSolidityCallData(
        proof,
        publicSignals
      );

      await expect(
        battler.battle(
          cometh.address,
          gotchi.address,
          73,
          0,
          0,
          0,
          S.split(",")[0]
        )
      ).to.be.revertedWith("Invalid proof.");
    });

    it("Should allow battling tokens with the correct winner value", async function () {
      const { proof, publicSignals } = await snarkjs.plonk.fullProve(
        INPUT,
        "./artifacts/circom/battle.wasm",
        "./artifacts/circom/battle.zkey"
      );

      const S = await snarkjs.plonk.exportSolidityCallData(
        proof,
        publicSignals
      );

      await expect(
        battler.battle(
          cometh.address,
          gotchi.address,
          73,
          0,
          0,
          1,
          S.split(",")[0]
        )
      )
        .to.emit(battler, "MatchResolved")
        .withArgs(
          cometh.address,
          gotchi.address,
          owner.address,
          1000073,
          0,
          1,
          0
        );
    });
  });
});
