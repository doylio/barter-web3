import { expect } from "chai";
import { ethers } from "hardhat";

describe("BarterMarket", function () {
  before(async function () {
    const [owner, account1, account2] = await ethers.getSigners();

    // Deploy Mock ERC20 Contract
    const ERC20Factory = await ethers.getContractFactory("MockERC20");
    const ERC20 = await ERC20Factory.deploy("Mock ERC20", "MERC20", 50000);
    await ERC20.deployed();

    console.log("ERC20 Deployed", ERC20.address);

    // Deploy Mock ERC721 Contract
    const ERC721Factory = await ethers.getContractFactory("MockERC721");
    const ERC721 = await ERC721Factory.deploy("Mock ERC721", "MERC721");
    await ERC721.deployed();

    console.log("ERC721 Deployed", ERC721.address);

    // Transfer ERC20 tokens to accounts
    await ERC20.transfer(account1.address, 1000);
    await ERC20.transfer(account2.address, 2000);

    // Mint NFTs

    // TokenIDs: 1 - 5
    for (var i = 0; i < 5; i++) {
      await ERC721.connect(account1).mint();
    }

    // TokenIDs: 6 - 15
    for (var i = 0; i < 10; i++) {
      await ERC721.connect(account2).mint();
    }

    this.owner = owner;
    this.account1 = account1;
    this.account2 = account2;
    this.erc721 = ERC721;
    this.erc20 = ERC20;
  });

  it("Account1 should have a balance of 1000 ERC20", async function () {
    expect(await this.erc20.balanceOf(this.account1.address)).to.equal(1000);
  });

  it("Account2 should have a balance of 2000 ERC20", async function () {
    expect(await this.erc20.balanceOf(this.account2.address)).to.equal(2000);
  });
});
