import { BigNumber } from "@ethersproject/bignumber";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BarterMarket, MockERC20, MockERC721 } from "../typechain";
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
  let ERC20A: MockERC20;
  let ERC20B: MockERC20;
  let ERC721A: MockERC721;
  let ERC721B: MockERC721;

  let barterMarket: BarterMarket;
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;
  let account2: SignerWithAddress;
  let account3: SignerWithAddress;

  beforeEach(async function () {
    [owner, account1, account2, account3] = await ethers.getSigners();

    // Deploy Mock ERC20 Contract
    const ERC20Factory = await ethers.getContractFactory("MockERC20");

    ERC20A = await ERC20Factory.deploy("Mock ERC20", "COINA", 50000);
    await ERC20A.deployed();

    ERC20B = await ERC20Factory.deploy("Mock ERC20 B", "COINB", 50000);
    await ERC20A.deployed();

    // Deploy Mock ERC721 Contract
    const ERC721Factory = await ethers.getContractFactory("MockERC721");

    ERC721A = await ERC721Factory.deploy("Mock ERC721", "NFTA");
    await ERC721A.deployed();

    ERC721B = await ERC721Factory.deploy("Mock ERC721 B", "NFTB");
    await ERC721A.deployed();

    const barterMarketFactory = await ethers.getContractFactory("BarterMarket");
    barterMarket = await barterMarketFactory.deploy();
    await barterMarket.deployed();

    // Transfer ERC20 tokens to accounts
    await ERC20A.transfer(account1.address, 1000);
    await ERC20A.transfer(account2.address, 2000);
    await ERC20B.transfer(account1.address, 2000);
    await ERC20B.transfer(account2.address, 1000);

    // Mint NFTs

    // TokenIDs: 1 - 5
    for (var i = 0; i < 5; i++) {
      await ERC721A.connect(account1).mint();
      await ERC721B.connect(account2).mint();
    }

    // TokenIDs: 6 - 15
    for (var i = 0; i < 10; i++) {
      await ERC721A.connect(account2).mint();
      await ERC721B.connect(account1).mint();
    }
  });

  describe("Test Setup", () => {
    it("Account1 should have the correct ERC20 and ERC721 balances", async function () {
      expect(await ERC20A.balanceOf(account1.address)).to.equal(1000);
      expect(await ERC20B.balanceOf(account1.address)).to.equal(2000);
      expect(await ERC721A.balanceOf(account1.address)).to.equal(5);
      expect(await ERC721B.balanceOf(account1.address)).to.equal(10);
    });

    it("Account2 should have the correct ERC20 and ERC721 balances", async function () {
      expect(await ERC20A.balanceOf(account2.address)).to.equal(2000);
      expect(await ERC20B.balanceOf(account2.address)).to.equal(1000);
      expect(await ERC721A.balanceOf(account2.address)).to.equal(10);
      expect(await ERC721B.balanceOf(account2.address)).to.equal(5);
    });
  });

  describe("createOffer", () => {
    it("can send a basic offer", async function () {
      // Define Offer
      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: {
          amounts: [BigNumber.from(100)],
          contractAddresses: [ERC20A.address],
        },
        nfts: {
          ids: [BigNumber.from(1)],
          contractAddresses: [ERC721A.address],
        },
      };

      // Account 1 allows contract to trade coins and nfts
      await ERC20A.connect(account1).approve(barterMarket.address, 100);
      await ERC721A.connect(account1).setApprovalForAll(
        barterMarket.address,
        true
      );

      // Define Ask
      const askBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("0"),
        tokens: {
          amounts: [BigNumber.from(50)],
          contractAddresses: [ERC20B.address],
        },
        nfts: {
          ids: [BigNumber.from(2)],
          contractAddresses: [ERC721B.address],
        },
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

    it("should accept a complicated offer", async () => {
      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: {
          amounts: [BigNumber.from(100), BigNumber.from(50)],
          contractAddresses: [ERC20A.address, ERC20B.address],
        },
        nfts: {
          ids: [BigNumber.from(1), BigNumber.from(2), BigNumber.from(12)],
          contractAddresses: [
            ERC721A.address,
            ERC721A.address,
            ERC721B.address,
          ],
        },
      };

      const askBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("2.0"),
        tokens: {
          amounts: [BigNumber.from(50), BigNumber.from(100)],
          contractAddresses: [ERC20B.address, ERC20A.address],
        },
        nfts: {
          ids: [BigNumber.from(3), BigNumber.from(13), BigNumber.from(15)],
          contractAddresses: [
            ERC721B.address,
            ERC721A.address,
            ERC721A.address,
          ],
        },
      };

      await barterMarket
        .connect(account1)
        .createOffer(account2.address, offerBundle, askBundle, {
          value: ethers.utils.parseEther("1.0"),
        });

      expect(await barterMarket.offerCount()).to.eq(1);

      const offer: TradeOfferArray = await barterMarket.offers(0);
      const offerJSON = TradeOfferArrayToJSON(offer);

      const expectedOfferJSON: TradeOfferJSON = {
        offerer: account1.address,
        target: account2.address,
        offerBundle,
        askBundle,
        state: OfferState.SENT,
      };

      expect(offerJSON).to.deep.eq(expectedOfferJSON);
    });

    it("should revert an offer to the zero address", () => {
      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: {
          amounts: [BigNumber.from(100)],
          contractAddresses: [ERC20A.address],
        },
        nfts: {
          ids: [BigNumber.from(1)],
          contractAddresses: [ERC721A.address],
        },
      };

      const askBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("0"),
        tokens: {
          amounts: [BigNumber.from(50)],
          contractAddresses: [ERC20B.address],
        },
        nfts: {
          ids: [BigNumber.from(2)],
          contractAddresses: [ERC721B.address],
        },
      };

      return expect(
        barterMarket
          .connect(account1)
          .createOffer(ethers.constants.AddressZero, offerBundle, askBundle, {
            value: ethers.utils.parseEther("1.0"),
          })
      ).to.be.revertedWith("Target address is invalid");
    });

    it("should revert an offer with insufficient ETH", () => {
      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: {
          amounts: [BigNumber.from(100)],
          contractAddresses: [ERC20A.address],
        },
        nfts: {
          ids: [BigNumber.from(1)],
          contractAddresses: [ERC721A.address],
        },
      };

      const askBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("0"),
        tokens: {
          amounts: [BigNumber.from(50)],
          contractAddresses: [ERC20B.address],
        },
        nfts: {
          ids: [BigNumber.from(2)],
          contractAddresses: [ERC721B.address],
        },
      };

      return expect(
        barterMarket
          .connect(account1)
          .createOffer(account2.address, offerBundle, askBundle, {
            value: ethers.utils.parseEther("0.5"),
          })
      ).to.be.revertedWith("Offer amount is not equal to the ETH sent");
    });

    it("should revert an offer with an invalid offer coin bundle", () => {
      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: {
          amounts: [BigNumber.from(100), BigNumber.from(10)],
          contractAddresses: [ERC20A.address],
        },
        nfts: {
          ids: [BigNumber.from(1)],
          contractAddresses: [ERC721A.address],
        },
      };

      const askBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("0"),
        tokens: {
          amounts: [BigNumber.from(50)],
          contractAddresses: [ERC20B.address],
        },
        nfts: {
          ids: [BigNumber.from(2)],
          contractAddresses: [ERC721B.address],
        },
      };

      return expect(
        barterMarket
          .connect(account1)
          .createOffer(account2.address, offerBundle, askBundle, {
            value: ethers.utils.parseEther("1.0"),
          })
      ).to.be.revertedWith(
        "Offer coin address and amount arrays are not the same length"
      );
    });

    it("should revert an offer with an invalid offer coin bundle", () => {
      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: {
          amounts: [BigNumber.from(100)],
          contractAddresses: [ERC20A.address, ERC20B.address],
        },
        nfts: {
          ids: [BigNumber.from(1)],
          contractAddresses: [ERC721A.address],
        },
      };

      const askBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("0"),
        tokens: {
          amounts: [BigNumber.from(50)],
          contractAddresses: [ERC20B.address],
        },
        nfts: {
          ids: [BigNumber.from(2)],
          contractAddresses: [ERC721B.address],
        },
      };

      return expect(
        barterMarket
          .connect(account1)
          .createOffer(account2.address, offerBundle, askBundle, {
            value: ethers.utils.parseEther("1.0"),
          })
      ).to.be.revertedWith(
        "Offer coin address and amount arrays are not the same length"
      );
    });

    it("should revert an offer with an invalid NFT bundle", () => {
      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: {
          amounts: [BigNumber.from(100)],
          contractAddresses: [ERC20A.address],
        },
        nfts: {
          ids: [BigNumber.from(1), BigNumber.from(2)],
          contractAddresses: [ERC721A.address],
        },
      };

      const askBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("0"),
        tokens: {
          amounts: [BigNumber.from(50)],
          contractAddresses: [ERC20B.address],
        },
        nfts: {
          ids: [BigNumber.from(2)],
          contractAddresses: [ERC721B.address],
        },
      };

      return expect(
        barterMarket
          .connect(account1)
          .createOffer(account2.address, offerBundle, askBundle, {
            value: ethers.utils.parseEther("1.0"),
          })
      ).to.be.revertedWith(
        "Offer NFT address and ID arrays are not the same length"
      );
    });

    it("should revert an offer with an invalid NFT bundle", () => {
      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: {
          amounts: [BigNumber.from(100)],
          contractAddresses: [ERC20A.address],
        },
        nfts: {
          ids: [BigNumber.from(1)],
          contractAddresses: [ERC721A.address, ERC721B.address],
        },
      };

      const askBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("0"),
        tokens: {
          amounts: [BigNumber.from(50)],
          contractAddresses: [ERC20B.address],
        },
        nfts: {
          ids: [BigNumber.from(2)],
          contractAddresses: [ERC721B.address],
        },
      };

      return expect(
        barterMarket
          .connect(account1)
          .createOffer(account2.address, offerBundle, askBundle, {
            value: ethers.utils.parseEther("1.0"),
          })
      ).to.be.revertedWith(
        "Offer NFT address and ID arrays are not the same length"
      );
    });

    it("should revert an offer with an invalid ask coin bundle", () => {
      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: {
          amounts: [BigNumber.from(100)],
          contractAddresses: [ERC20A.address],
        },
        nfts: {
          ids: [BigNumber.from(1)],
          contractAddresses: [ERC721A.address],
        },
      };

      const askBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("0"),
        tokens: {
          amounts: [BigNumber.from(50), BigNumber.from(10)],
          contractAddresses: [ERC20B.address],
        },
        nfts: {
          ids: [BigNumber.from(2)],
          contractAddresses: [ERC721B.address],
        },
      };

      return expect(
        barterMarket
          .connect(account1)
          .createOffer(account2.address, offerBundle, askBundle, {
            value: ethers.utils.parseEther("1.0"),
          })
      ).to.be.revertedWith(
        "Ask coin address and amount arrays are not the same length"
      );
    });

    it("should revert an offer with an invalid ask coin bundle", () => {
      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: {
          amounts: [BigNumber.from(100)],
          contractAddresses: [ERC20A.address],
        },
        nfts: {
          ids: [BigNumber.from(1)],
          contractAddresses: [ERC721A.address],
        },
      };

      const askBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("0"),
        tokens: {
          amounts: [BigNumber.from(50)],
          contractAddresses: [ERC20B.address, ERC20A.address],
        },
        nfts: {
          ids: [BigNumber.from(2)],
          contractAddresses: [ERC721B.address],
        },
      };

      return expect(
        barterMarket
          .connect(account1)
          .createOffer(account2.address, offerBundle, askBundle, {
            value: ethers.utils.parseEther("1.0"),
          })
      ).to.be.revertedWith(
        "Ask coin address and amount arrays are not the same length"
      );
    });

    it("should revert an offer with an invalid ask NFT bundle", () => {
      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: {
          amounts: [BigNumber.from(100)],
          contractAddresses: [ERC20A.address],
        },
        nfts: {
          ids: [BigNumber.from(1)],
          contractAddresses: [ERC721A.address],
        },
      };

      const askBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("0"),
        tokens: {
          amounts: [BigNumber.from(50)],
          contractAddresses: [ERC20B.address],
        },
        nfts: {
          ids: [BigNumber.from(2), BigNumber.from(3)],
          contractAddresses: [ERC721B.address],
        },
      };

      return expect(
        barterMarket
          .connect(account1)
          .createOffer(account2.address, offerBundle, askBundle, {
            value: ethers.utils.parseEther("1.0"),
          })
      ).to.be.revertedWith(
        "Ask NFT address and ID arrays are not the same length"
      );
    });

    it("should revert an offer with an invalid ask NFT bundle", () => {
      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: {
          amounts: [BigNumber.from(100)],
          contractAddresses: [ERC20A.address],
        },
        nfts: {
          ids: [BigNumber.from(1)],
          contractAddresses: [ERC721A.address],
        },
      };

      const askBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("0"),
        tokens: {
          amounts: [BigNumber.from(50)],
          contractAddresses: [ERC20B.address],
        },
        nfts: {
          ids: [BigNumber.from(2)],
          contractAddresses: [ERC721B.address, ERC721A.address],
        },
      };

      return expect(
        barterMarket
          .connect(account1)
          .createOffer(account2.address, offerBundle, askBundle, {
            value: ethers.utils.parseEther("1.0"),
          })
      ).to.be.revertedWith(
        "Ask NFT address and ID arrays are not the same length"
      );
    });
  });

  describe("acceptOffer", () => {
    it("can accept a basic offer", async function () {
      // Define Offer
      const offerCoins: CoinBundleJSON = {
        amounts: [BigNumber.from(100)],
        contractAddresses: [ERC20A.address],
      };

      const offerNfts: NFTBundleJSON = {
        ids: [BigNumber.from(1)],
        contractAddresses: [ERC721A.address],
      };

      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: offerCoins,
        nfts: offerNfts,
      };

      // Account 1 allows contract to trade coins and nfts
      await ERC20A.connect(account1).approve(barterMarket.address, 100);

      await ERC721A.connect(account1).setApprovalForAll(
        barterMarket.address,
        true
      );

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

      await barterMarket
        .connect(account1)
        .createOffer(account2.address, offerBundle, askBundle, {
          value: offerBundle.offeredEther,
        });

      // Account 2 allows contract to trade coins and nfts
      await ERC20B.connect(account2).approve(barterMarket.address, 50);

      await ERC721B.connect(account2).setApprovalForAll(
        barterMarket.address,
        true
      );

      await expect(() =>
        barterMarket.connect(account2).acceptOffer(0)
      ).to.changeEtherBalances(
        [account1, account2],
        [0, offerBundle.offeredEther]
      );

      expect(await ERC20A.balanceOf(account1.address)).to.equal(900);
      expect(await ERC20A.balanceOf(account2.address)).to.equal(2100);
      expect(await ERC20B.balanceOf(account1.address)).to.equal(2050);
      expect(await ERC20B.balanceOf(account2.address)).to.equal(950);

      expect(await ERC721A.ownerOf(1)).to.equal(account2.address);
      expect(await ERC721B.ownerOf(1)).to.equal(account1.address);
    });

    it("can accept an offer and trade only coins", async function () {
      // Define Offer
      const offerCoins: CoinBundleJSON = {
        amounts: [BigNumber.from(100)],
        contractAddresses: [ERC20A.address],
      };

      const offerNfts: NFTBundleJSON = {
        ids: [],
        contractAddresses: [],
      };

      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("0"),
        tokens: offerCoins,
        nfts: offerNfts,
      };

      // Account 1 allows contract to trade coins and nfts
      await ERC20A.connect(account1).approve(barterMarket.address, 100);

      // Define Ask
      const askCoins: CoinBundleJSON = {
        amounts: [BigNumber.from(50)],
        contractAddresses: [ERC20B.address],
      };

      const askNfts: NFTBundleJSON = {
        ids: [],
        contractAddresses: [],
      };

      const askBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("0"),
        tokens: askCoins,
        nfts: askNfts,
      };

      await barterMarket
        .connect(account1)
        .createOffer(account2.address, offerBundle, askBundle);

      // Account 2 allows contract to trade coins and nfts
      await ERC20B.connect(account2).approve(barterMarket.address, 50);

      await expect(() =>
        barterMarket.connect(account2).acceptOffer(0)
      ).to.changeEtherBalances([account1, account2], [0, 0]);

      expect(await ERC20A.balanceOf(account1.address)).to.equal(900);
      expect(await ERC20A.balanceOf(account2.address)).to.equal(2100);
      expect(await ERC20B.balanceOf(account1.address)).to.equal(2050);
      expect(await ERC20B.balanceOf(account2.address)).to.equal(950);
    });

    it("can accept an offer and trade only nfts", async function () {
      // Define Offer
      const offerCoins: CoinBundleJSON = {
        amounts: [],
        contractAddresses: [],
      };

      const offerNfts: NFTBundleJSON = {
        ids: [BigNumber.from(1)],
        contractAddresses: [ERC721A.address],
      };

      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("0"),
        tokens: offerCoins,
        nfts: offerNfts,
      };

      // Account 1 allows contract to trade coins and nfts
      await ERC721A.connect(account1).setApprovalForAll(
        barterMarket.address,
        true
      );

      // Define Ask
      const askCoins: CoinBundleJSON = {
        amounts: [],
        contractAddresses: [],
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

      await barterMarket
        .connect(account1)
        .createOffer(account2.address, offerBundle, askBundle);

      // Account 2 allows contract to trade coins and nfts
      await ERC721B.connect(account2).setApprovalForAll(
        barterMarket.address,
        true
      );

      await expect(() =>
        barterMarket.connect(account2).acceptOffer(0)
      ).to.changeEtherBalances([account1, account2], [0, 0]);

      expect(await ERC721A.ownerOf(1)).to.equal(account2.address);
      expect(await ERC721B.ownerOf(1)).to.equal(account1.address);
    });

    it("can accept an offer with only eth", async function () {
      // Define Offer
      const offerCoins: CoinBundleJSON = {
        amounts: [],
        contractAddresses: [],
      };

      const offerNfts: NFTBundleJSON = {
        ids: [],
        contractAddresses: [],
      };

      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: offerCoins,
        nfts: offerNfts,
      };

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

      await barterMarket
        .connect(account1)
        .createOffer(account2.address, offerBundle, askBundle, {
          value: offerBundle.offeredEther,
        });

      // Account 2 allows contract to trade coins and nfts
      await ERC20B.connect(account2).approve(barterMarket.address, 50);
      await ERC721B.connect(account2).setApprovalForAll(
        barterMarket.address,
        true
      );

      await expect(() =>
        barterMarket.connect(account2).acceptOffer(0)
      ).to.changeEtherBalances(
        [account1, account2],
        [0, offerBundle.offeredEther]
      );

      expect(await ERC20B.balanceOf(account1.address)).to.equal(2050);
      expect(await ERC20B.balanceOf(account2.address)).to.equal(950);

      expect(await ERC721A.ownerOf(1)).to.equal(account1.address);
      expect(await ERC721B.ownerOf(1)).to.equal(account1.address);
    });

    it("can accept an empty offer", async function () {
      // Define Offer
      const offerCoins: CoinBundleJSON = {
        amounts: [],
        contractAddresses: [],
      };

      const offerNfts: NFTBundleJSON = {
        ids: [],
        contractAddresses: [],
      };

      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("0"),
        tokens: offerCoins,
        nfts: offerNfts,
      };

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

      await barterMarket
        .connect(account1)
        .createOffer(account2.address, offerBundle, askBundle);

      // Account 2 allows contract to trade coins and nfts
      await ERC20B.connect(account2).approve(barterMarket.address, 50);

      await ERC721B.connect(account2).setApprovalForAll(
        barterMarket.address,
        true
      );

      await expect(() =>
        barterMarket.connect(account2).acceptOffer(0)
      ).to.changeEtherBalances([account1, account2], [0, 0]);

      expect(await ERC20B.balanceOf(account1.address)).to.equal(2050);
      expect(await ERC20B.balanceOf(account2.address)).to.equal(950);

      expect(await ERC721A.ownerOf(1)).to.equal(account1.address);
      expect(await ERC721B.ownerOf(1)).to.equal(account1.address);
    });

    it("can trade amounts different sums of eth ", async function () {
      // Define Offer
      const offerCoins: CoinBundleJSON = {
        amounts: [],
        contractAddresses: [],
      };

      const offerNfts: NFTBundleJSON = {
        ids: [],
        contractAddresses: [],
      };

      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: offerCoins,
        nfts: offerNfts,
      };

      // Define Ask
      const askCoins: CoinBundleJSON = {
        amounts: [],
        contractAddresses: [],
      };

      const askNfts: NFTBundleJSON = {
        ids: [],
        contractAddresses: [],
      };

      const askBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("0.5"),
        tokens: askCoins,
        nfts: askNfts,
      };

      await barterMarket
        .connect(account1)
        .createOffer(account2.address, offerBundle, askBundle, {
          value: offerBundle.offeredEther,
        });

      await expect(() =>
        barterMarket
          .connect(account2)
          .acceptOffer(0, { value: askBundle.offeredEther })
      ).to.changeEtherBalances(
        [account1, account2],
        [
          askBundle.offeredEther,
          offerBundle.offeredEther.sub(askBundle.offeredEther),
        ]
      );
    });

    it("Ensures offer was made to the person calling the function", async function () {
      // Define Offer
      const offerCoins: CoinBundleJSON = {
        amounts: [BigNumber.from(100)],
        contractAddresses: [ERC20A.address],
      };

      const offerNfts: NFTBundleJSON = {
        ids: [BigNumber.from(1)],
        contractAddresses: [ERC721A.address],
      };

      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: offerCoins,
        nfts: offerNfts,
      };

      // Account 1 allows contract to trade coins and nfts
      await ERC20A.connect(account1).approve(barterMarket.address, 100);
      await ERC721A.connect(account1).setApprovalForAll(
        barterMarket.address,
        true
      );

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

      await barterMarket
        .connect(account1)
        .createOffer(account2.address, offerBundle, askBundle, {
          value: ethers.utils.parseEther("1.0"),
        });

      // Account 2 allows contract to trade coins and nfts
      await ERC20B.connect(account2).approve(barterMarket.address, 50);
      await ERC721B.connect(account2).setApprovalForAll(
        barterMarket.address,
        true
      );

      await expect(
        barterMarket.connect(account3).acceptOffer(0)
      ).to.be.revertedWith("This offer was not sent to you");
    });

    it("Ensures enough eth is sent when accepting an offer", async function () {
      // Define Offer
      const offerCoins: CoinBundleJSON = {
        amounts: [BigNumber.from(100)],
        contractAddresses: [ERC20A.address],
      };

      const offerNfts: NFTBundleJSON = {
        ids: [BigNumber.from(1)],
        contractAddresses: [ERC721A.address],
      };

      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: offerCoins,
        nfts: offerNfts,
      };

      // Account 1 allows contract to trade coins and nfts
      await ERC20A.connect(account1).approve(barterMarket.address, 100);

      await ERC721A.connect(account1).setApprovalForAll(
        barterMarket.address,
        true
      );

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
        offeredEther: ethers.utils.parseEther("1"),
        tokens: askCoins,
        nfts: askNfts,
      };

      await barterMarket
        .connect(account1)
        .createOffer(account2.address, offerBundle, askBundle, {
          value: offerBundle.offeredEther,
        });

      // Account 2 allows contract to trade coins and nfts
      await ERC20B.connect(account2).approve(barterMarket.address, 50);

      await ERC721B.connect(account2).setApprovalForAll(
        barterMarket.address,
        true
      );

      await expect(
        barterMarket.connect(account2).acceptOffer(0)
      ).to.be.revertedWith(
        "Offer amount is not equal to the amount of ETH sent"
      );
    });

    it("Ensures an offer is still valid before it can be accepted", async function () {
      // Define Offer
      const offerCoins: CoinBundleJSON = {
        amounts: [BigNumber.from(100)],
        contractAddresses: [ERC20A.address],
      };

      const offerNfts: NFTBundleJSON = {
        ids: [BigNumber.from(1)],
        contractAddresses: [ERC721A.address],
      };

      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: offerCoins,
        nfts: offerNfts,
      };

      // Account 1 allows contract to trade coins and nfts
      await ERC20A.connect(account1).approve(barterMarket.address, 100);

      await ERC721A.connect(account1).setApprovalForAll(
        barterMarket.address,
        true
      );

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

      await barterMarket
        .connect(account1)
        .createOffer(account2.address, offerBundle, askBundle, {
          value: offerBundle.offeredEther,
        });

      // Account 2 allows contract to trade coins and nfts
      await ERC20B.connect(account2).approve(barterMarket.address, 50);
      await ERC721B.connect(account2).setApprovalForAll(
        barterMarket.address,
        true
      );

      // Accept off the first time
      await barterMarket.connect(account2).acceptOffer(0);

      await expect(
        barterMarket.connect(account2).acceptOffer(0)
      ).to.be.revertedWith("This offer is no longer available");
    });

    it("Ensures that the person accepting the offer has enough coins", async function () {
      // Define Offer
      const offerCoins: CoinBundleJSON = {
        amounts: [BigNumber.from(100)],
        contractAddresses: [ERC20A.address],
      };

      const offerNfts: NFTBundleJSON = {
        ids: [BigNumber.from(1)],
        contractAddresses: [ERC721A.address],
      };

      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: offerCoins,
        nfts: offerNfts,
      };

      // Account 1 allows contract to trade coins and nfts
      await ERC20A.connect(account1).approve(barterMarket.address, 100);
      await ERC721A.connect(account1).setApprovalForAll(
        barterMarket.address,
        true
      );

      const largeNumber = 500000000;

      // Define Ask
      const askCoins: CoinBundleJSON = {
        amounts: [BigNumber.from(largeNumber)],
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

      await barterMarket
        .connect(account1)
        .createOffer(account2.address, offerBundle, askBundle, {
          value: offerBundle.offeredEther,
        });

      // Account 2 allows contract to trade coins and nfts
      await ERC20B.connect(account2).approve(barterMarket.address, largeNumber);
      await ERC721B.connect(account2).setApprovalForAll(
        barterMarket.address,
        true
      );

      await expect(
        barterMarket.connect(account2).acceptOffer(0)
      ).to.be.revertedWith("Not enough tokens");
    });

    it("Ensures that the person accepting the offer approved enough coins", async function () {
      // Define Offer
      const offerCoins: CoinBundleJSON = {
        amounts: [BigNumber.from(100)],
        contractAddresses: [ERC20A.address],
      };

      const offerNfts: NFTBundleJSON = {
        ids: [BigNumber.from(1)],
        contractAddresses: [ERC721A.address],
      };

      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: offerCoins,
        nfts: offerNfts,
      };

      // Account 1 allows contract to trade coins and nfts
      await ERC20A.connect(account1).approve(barterMarket.address, 100);
      await ERC721A.connect(account1).setApprovalForAll(
        barterMarket.address,
        true
      );

      // Define Ask
      const askCoins: CoinBundleJSON = {
        amounts: [BigNumber.from(100)],
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

      await barterMarket
        .connect(account1)
        .createOffer(account2.address, offerBundle, askBundle, {
          value: offerBundle.offeredEther,
        });

      // Account 2 allows contract to trade coins and nfts
      await ERC20B.connect(account2).approve(barterMarket.address, 50);
      await ERC721B.connect(account2).setApprovalForAll(
        barterMarket.address,
        true
      );

      await expect(
        barterMarket.connect(account2).acceptOffer(0)
      ).to.be.revertedWith("Not enough allowed tokens");
    });

    it("Ensures that the person accepting an offer has approved any NFTs", async function () {
      // Define Offer
      const offerCoins: CoinBundleJSON = {
        amounts: [BigNumber.from(100)],
        contractAddresses: [ERC20A.address],
      };

      const offerNfts: NFTBundleJSON = {
        ids: [BigNumber.from(1)],
        contractAddresses: [ERC721A.address],
      };

      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: offerCoins,
        nfts: offerNfts,
      };

      // Account 1 allows contract to trade coins and nfts
      await ERC20A.connect(account1).approve(barterMarket.address, 100);
      await ERC721A.connect(account1).setApprovalForAll(
        barterMarket.address,
        true
      );

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

      await barterMarket
        .connect(account1)
        .createOffer(account2.address, offerBundle, askBundle, {
          value: offerBundle.offeredEther,
        });

      // Account 2 allows contract to trade coins and nfts
      await ERC20B.connect(account2).approve(barterMarket.address, 50);

      await expect(
        barterMarket.connect(account2).acceptOffer(0)
      ).to.be.revertedWith("Not approved for all NFT transfers");
    });

    it("Ensures that the person accepting an owns the nfts they're trying to trade", async function () {
      // Define Offer
      const offerCoins: CoinBundleJSON = {
        amounts: [BigNumber.from(100)],
        contractAddresses: [ERC20A.address],
      };

      const offerNfts: NFTBundleJSON = {
        ids: [BigNumber.from(1)],
        contractAddresses: [ERC721A.address],
      };

      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: offerCoins,
        nfts: offerNfts,
      };

      // Account 1 allows contract to trade coins and nfts
      await ERC20A.connect(account1).approve(barterMarket.address, 100);
      await ERC721A.connect(account1).setApprovalForAll(
        barterMarket.address,
        true
      );

      // Define Ask
      const askCoins: CoinBundleJSON = {
        amounts: [BigNumber.from(50)],
        contractAddresses: [ERC20B.address],
      };

      const askNfts: NFTBundleJSON = {
        ids: [BigNumber.from(10)],
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
          value: offerBundle.offeredEther,
        });

      // Account 2 allows contract to trade coins and nfts
      await ERC20B.connect(account2).approve(barterMarket.address, 50);

      await expect(
        barterMarket.connect(account2).acceptOffer(0)
      ).to.be.revertedWith("You no longer own this nft");
    });

    it("Ensures the person sending the offer has enough coins", async function () {
      // Define Offer
      const tooMany = 600000;

      const offerCoins: CoinBundleJSON = {
        amounts: [BigNumber.from(tooMany)],
        contractAddresses: [ERC20A.address],
      };

      const offerNfts: NFTBundleJSON = {
        ids: [BigNumber.from(1)],
        contractAddresses: [ERC721A.address],
      };

      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: offerCoins,
        nfts: offerNfts,
      };

      // Account 1 allows contract to trade coins and nfts
      await ERC20A.connect(account1).approve(barterMarket.address, tooMany);
      await ERC721A.connect(account1).setApprovalForAll(
        barterMarket.address,
        true
      );

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

      await barterMarket
        .connect(account1)
        .createOffer(account2.address, offerBundle, askBundle, {
          value: offerBundle.offeredEther,
        });

      // Account 2 allows contract to trade coins and nfts
      await ERC20B.connect(account2).approve(barterMarket.address, 50);
      await ERC721B.connect(account2).setApprovalForAll(
        barterMarket.address,
        true
      );

      await expect(
        barterMarket.connect(account2).acceptOffer(0)
      ).to.be.revertedWith("Not enough tokens");
    });

    it("Ensures the person sending the offer has enough allowed coins", async function () {
      // Define Offer
      const offerCoins: CoinBundleJSON = {
        amounts: [BigNumber.from(300)],
        contractAddresses: [ERC20A.address],
      };

      const offerNfts: NFTBundleJSON = {
        ids: [BigNumber.from(1)],
        contractAddresses: [ERC721A.address],
      };

      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: offerCoins,
        nfts: offerNfts,
      };

      // Account 1 allows contract to trade coins and nfts
      await ERC20A.connect(account1).approve(barterMarket.address, 100);
      await ERC721A.connect(account1).setApprovalForAll(
        barterMarket.address,
        true
      );

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

      await barterMarket
        .connect(account1)
        .createOffer(account2.address, offerBundle, askBundle, {
          value: offerBundle.offeredEther,
        });

      // Account 2 allows contract to trade coins and nfts
      await ERC20B.connect(account2).approve(barterMarket.address, 50);
      await ERC721B.connect(account2).setApprovalForAll(
        barterMarket.address,
        true
      );

      await expect(
        barterMarket.connect(account2).acceptOffer(0)
      ).to.be.revertedWith("not enough allowed tokens");
    });

    it("Ensures that the person sending the offer has approved any NFTs", async function () {
      // Define Offer
      const offerCoins: CoinBundleJSON = {
        amounts: [BigNumber.from(100)],
        contractAddresses: [ERC20A.address],
      };

      const offerNfts: NFTBundleJSON = {
        ids: [BigNumber.from(1)],
        contractAddresses: [ERC721A.address],
      };

      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: offerCoins,
        nfts: offerNfts,
      };

      // Account 1 allows contract to trade coins and nfts
      await ERC20A.connect(account1).approve(barterMarket.address, 100);

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

      await barterMarket
        .connect(account1)
        .createOffer(account2.address, offerBundle, askBundle, {
          value: offerBundle.offeredEther,
        });

      // Account 2 allows contract to trade coins and nfts
      await ERC20B.connect(account2).approve(barterMarket.address, 50);
      await ERC721B.connect(account2).setApprovalForAll(
        barterMarket.address,
        true
      );

      await expect(
        barterMarket.connect(account2).acceptOffer(0)
      ).to.be.revertedWith("Not approved for all NFT transfers");
    });

    it("Ensures that the person sending the offer owns NFTs they try and trade", async function () {
      // Define Offer
      const offerCoins: CoinBundleJSON = {
        amounts: [BigNumber.from(100)],
        contractAddresses: [ERC20A.address],
      };

      const offerNfts: NFTBundleJSON = {
        ids: [BigNumber.from(10)],
        contractAddresses: [ERC721A.address],
      };

      const offerBundle: BundleJSON = {
        offeredEther: ethers.utils.parseEther("1.0"),
        tokens: offerCoins,
        nfts: offerNfts,
      };

      // Account 1 allows contract to trade coins and nfts
      await ERC20A.connect(account1).approve(barterMarket.address, 100);

      await ERC721A.connect(account1).setApprovalForAll(
        barterMarket.address,
        true
      );

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

      await barterMarket
        .connect(account1)
        .createOffer(account2.address, offerBundle, askBundle, {
          value: offerBundle.offeredEther,
        });

      // Account 2 allows contract to trade coins and nfts
      await ERC20B.connect(account2).approve(barterMarket.address, 50);
      await ERC721B.connect(account2).setApprovalForAll(
        barterMarket.address,
        true
      );

      await expect(
        barterMarket.connect(account2).acceptOffer(0)
      ).to.be.revertedWith("Not the offerers NFT anymore");
    });

    // TO-DO
    it("Ensures the contract has enough eth to send the target", async function () {});
  });
});
