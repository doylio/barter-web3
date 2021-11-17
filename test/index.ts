import { BigNumber } from "@ethersproject/bignumber";
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
  weiInEth,
} from "./utils";

describe("BarterMarket", function () {
  let ERC20: MockERC20;
  let ERC20B: MockERC20;
  let ERC721: MockERC721;
  let ERC721B: MockERC721;
  let barterMarket: BarterWalletFactory;
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;
  let account2: SignerWithAddress;

  beforeEach(async function () {
    [owner, account1, account2] = await ethers.getSigners();

    // Deploy Mock ERC20 Contract
    const ERC20Factory = await ethers.getContractFactory("MockERC20");

    ERC20 = await ERC20Factory.deploy("Mock ERC20", "COINA", 50000);
    await ERC20.deployed();
    console.log("ERC20 A Deployed", ERC20.address);

    ERC20B = await ERC20Factory.deploy("Mock ERC20 B", "COINB", 50000);
    await ERC20.deployed();
    console.log("ERC20 B Deployed", ERC20.address);

    // Deploy Mock ERC721 Contract
    const ERC721Factory = await ethers.getContractFactory("MockERC721");

    ERC721 = await ERC721Factory.deploy("Mock ERC721", "NFTA");
    await ERC721.deployed();
    console.log("ERC721 Deployed", ERC721.address);

    ERC721B = await ERC721Factory.deploy("Mock ERC721 B", "NFTB");
    await ERC721.deployed();
    console.log("ERC721 B Deployed", ERC721.address);

    const barterMarketFactory = await ethers.getContractFactory(
      "BarterWalletFactory"
    );
    barterMarket = await barterMarketFactory.deploy();
    await barterMarket.deployed();

    console.log("BarterWallet Deployed");

    // Transfer ERC20 tokens to accounts
    await ERC20.transfer(account1.address, 1000);
    await ERC20.transfer(account2.address, 2000);
    await ERC20B.transfer(account1.address, 2000);
    await ERC20B.transfer(account2.address, 1000);

    // Mint NFTs

    // TokenIDs: 1 - 5
    for (var i = 0; i < 5; i++) {
      await ERC721.connect(account1).mint();
      await ERC721B.connect(account2).mint();
    }

    // TokenIDs: 6 - 15
    for (var i = 0; i < 10; i++) {
      await ERC721.connect(account2).mint();
      await ERC721B.connect(account1).mint();
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
      amounts: [BigNumber.from(100)],
      contractAddresses: [ERC20.address],
    };

    const offerNfts: NFTBundleJSON = {
      ids: [BigNumber.from(1)],
      contractAddresses: [ERC721.address],
    };

    const offerBundle: BundleJSON = {
      offeredEther: ethers.utils.parseEther("1.0"),
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
      amounts: [BigNumber.from(50)],
      contractAddresses: [ERC20B.address],
    };

    const askNfts: NFTBundleJSON = {
      ids: [BigNumber.from(2)],
      contractAddresses: [ERC721B.address],
    };

    const askBundle: BundleJSON = {
      offeredEther: ethers.utils.parseEther("0"),
      tokens: askCoins,
      nfts: askNfts,
    };

    await barterMarket
      .connect(account1)
      .createOffer(account2.address, offerBundle, askBundle, {
        value: ethers.utils.parseEther("1.0"),
      });

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

  it("can accept a basic offer", async function () {
    const a1InitialBalance = await account1.getBalance();
    const a2InitialBalance = await account2.getBalance();

    let a1GasFees = BigNumber.from(0);
    let a2GasFees = BigNumber.from(0);

    // Define Offer
    const offerCoins: CoinBundleJSON = {
      amounts: [BigNumber.from(100)],
      contractAddresses: [ERC20.address],
    };

    const offerNfts: NFTBundleJSON = {
      ids: [BigNumber.from(1)],
      contractAddresses: [ERC721.address],
    };

    const offerBundle: BundleJSON = {
      offeredEther: ethers.utils.parseEther("1.0"),
      tokens: offerCoins,
      nfts: offerNfts,
    };

    // Account 1 allows contract to trade coins and nfts
    let txn = await ERC20.connect(account1).approve(barterMarket.address, 100);
    let receipt = await txn.wait();
    a1GasFees = a1GasFees.add(receipt.gasUsed.mul(receipt.effectiveGasPrice));

    txn = await ERC721.connect(account1).setApprovalForAll(
      barterMarket.address,
      true
    );
    receipt = await txn.wait();
    a1GasFees = a1GasFees.add(receipt.gasUsed.mul(receipt.effectiveGasPrice));

    // Define Ask
    const askCoins: CoinBundleJSON = {
      amounts: [BigNumber.from(50)],
      contractAddresses: [ERC20B.address],
    };

    const askNfts: NFTBundleJSON = {
      ids: [BigNumber.from(1)],
      contractAddresses: [ERC721B.address],
    };

    const askBundle: BundleJSON = {
      offeredEther: ethers.utils.parseEther("0"),
      tokens: askCoins,
      nfts: askNfts,
    };

    txn = await barterMarket
      .connect(account1)
      .createOffer(account2.address, offerBundle, askBundle, {
        value: ethers.utils.parseEther("1.0"),
      });
    receipt = await txn.wait();
    a1GasFees = a1GasFees.add(receipt.gasUsed.mul(receipt.effectiveGasPrice));

    // Account 2 allows contract to trade coins and nfts
    txn = await ERC20B.connect(account2).approve(barterMarket.address, 50);
    receipt = await txn.wait();
    a2GasFees = a2GasFees.add(receipt.gasUsed.mul(receipt.effectiveGasPrice));

    txn = await ERC721B.connect(account2).setApprovalForAll(
      barterMarket.address,
      true
    );
    receipt = await txn.wait();
    a2GasFees = a2GasFees.add(receipt.gasUsed.mul(receipt.effectiveGasPrice));

    txn = await barterMarket.connect(account2).acceptOffer(0);
    receipt = await txn.wait();
    a2GasFees = a2GasFees.add(receipt.gasUsed.mul(receipt.effectiveGasPrice));

    expect(await ERC20.balanceOf(account1.address)).to.equal(900);
    expect(await ERC20.balanceOf(account2.address)).to.equal(2100);
    expect(await ERC20B.balanceOf(account1.address)).to.equal(2050);
    expect(await ERC20B.balanceOf(account2.address)).to.equal(950);

    expect(await ERC721.ownerOf(1)).to.equal(account2.address);
    expect(await ERC721B.ownerOf(1)).to.equal(account1.address);

    const a1CurrentBalance = await account1.getBalance();
    const a2CurrentBalance = await account2.getBalance();

    const amountTransfered = offerBundle.offeredEther;

    console.log("\nStarting Balances:");
    console.log("account 1: " + ethers.utils.formatEther(a1InitialBalance));
    console.log(
      "account 2: " + ethers.utils.formatEther(a2InitialBalance) + "\n"
    );

    console.log("\nGas Fees:");
    console.log("account 1: " + ethers.utils.formatEther(a1GasFees));
    console.log("account 2: " + ethers.utils.formatEther(a2GasFees) + "\n");

    console.log("\nEnding Balances:");
    console.log("account 1: " + ethers.utils.formatEther(a1CurrentBalance));
    console.log(
      "account 2: " + ethers.utils.formatEther(a2CurrentBalance) + "\n"
    );

    expect(a2CurrentBalance).to.equal(
      a2InitialBalance.add(amountTransfered).sub(a2GasFees)
    );

    expect(a1CurrentBalance).to.equal(
      a1InitialBalance.sub(amountTransfered).sub(a1GasFees)
    );
  });
});
