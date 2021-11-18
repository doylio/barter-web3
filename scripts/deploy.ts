import { ethers } from "hardhat";

async function main() {
  // We get the contract to deploy
  const barterMarketFactory = await ethers.getContractFactory("BarterMarket");
  const barterMarket = await barterMarketFactory.deploy();
  await barterMarket.deployed();

  console.log("barter deployed to:", barterMarket.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
