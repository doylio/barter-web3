import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BarterWalletFactory, MockERC20, MockERC721 } from "../typechain";
import {
  BundleJSON,
  CoinBundleJSON,
  NFTBundleJSON,
  OfferState,
  TradeOfferArray,
  TradeOfferArrayToJSON,
  TradeOfferJSON,
} from "./utils";

describe("BarterMarket", function () {
  let ERC20: MockERC20;
  let ERC721: MockERC721;
  let barterMarket: BarterWalletFactory;
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;
  let account2: SignerWithAddress;

  beforeEach(async function () {
    [owner, account1, account2] = await ethers.getSigners();

    // Deploy Mock ERC20 Contract
    const ERC20Factory = await ethers.getContractFactory("MockERC20");
    ERC20 = await ERC20Factory.deploy("Mock ERC20", "MERC20", 50000);
    await ERC20.deployed();

    console.log("ERC20 Deployed", ERC20.address);

    // Deploy Mock ERC721 Contract
    const ERC721Factory = await ethers.getContractFactory("MockERC721");
    ERC721 = await ERC721Factory.deploy("Mock ERC721", "MERC721");
    await ERC721.deployed();

    console.log("ERC721 Deployed", ERC721.address);

    const barterMarketFactory = await ethers.getContractFactory(
      "BarterWalletFactory"
    );
    barterMarket = await barterMarketFactory.deploy();
    await barterMarket.deployed();

    console.log("BarterWallet Deployed");

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
  });

  it("Account1 should have a balance of 1000 ERC20", async function () {
    expect(await ERC20.balanceOf(account1.address)).to.equal(1000);
  });

  it("Account2 should have a balance of 2000 ERC20", async function () {
    expect(await ERC20.balanceOf(account2.address)).to.equal(2000);
  });

  it("can send a basic offer", async function () {
    // Define Offer
    const offerCoins: CoinBundleJSON = {
      amounts: [100],
      contractAddresses: [ERC20.address],
    };

    const offerNfts: NFTBundleJSON = {
      ids: [1],
      contractAddresses: [ERC721.address],
    };

    const offerBundle: BundleJSON = {
      offeredEther: 0,
      tokens: offerCoins,
      nfts: offerNfts,
    };

    // Account 1 allows contract to trade coins and nfts
    await ERC20.connect(account1).approve(barterMarket.address, 100);
    await ERC721.connect(account1).setApprovalForAll(
      barterMarket.address,
      true
    );

    // Define Ask
    const askCoins: CoinBundleJSON = {
      amounts: [50],
      contractAddresses: [ERC20.address],
    };

    const askNfts: NFTBundleJSON = {
      ids: [15],
      contractAddresses: [ERC721.address],
    };

    const askBundle: BundleJSON = {
      offeredEther: 0,
      tokens: askCoins,
      nfts: askNfts,
    };

    await barterMarket
      .connect(account1)
      .createOffer(account2.address, offerBundle, askBundle);

    const offerCount = await barterMarket.offerCount();
    expect(offerCount).to.equal(1);

    const offer: TradeOfferArray = await barterMarket.offers(0);
    const offerJSON = TradeOfferArrayToJSON(offer);

    const expectedOffer: TradeOfferJSON = {
      offerer: account1.address,
      target: account2.address,
      offerBundle: offerBundle,
      askBundle: askBundle,
      state: OfferState.SENT,
    };

    expect(offerJSON).to.eql(expectedOffer);
  });
});
