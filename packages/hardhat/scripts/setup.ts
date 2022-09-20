import { deployments, ethers } from "hardhat";

const { execute, get } = deployments;

async function main() {
  const from = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";

  await execute(
    "SpaceShipsRules",
    { from, log: true },
    "makeRule",
    1,
    100,
    0,
    0,
    0
  );

  await execute("SpaceShips", { from, log: true }, "newModel", 1, 70);

  for (let i = 0; i < 70; i += 1) {
    await execute("SpaceShips", { from, log: true }, "mint", from, 1);
  }

  for (let i = 0; i < 50; i += 1) {
    await execute("Aavegotchi", { from, log: true }, "mintWithTraits", from);
  }

  const orcProx = await get("Proxy");
  const orc = await ethers.getContractAt("EtherOrcsPoly", orcProx.address);
  await orc.initMint(orc.address, 1, 101);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
