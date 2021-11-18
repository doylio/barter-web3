//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";


contract BarterMarket {
	using SafeERC20 for IERC20;
	using SafeMath for uint256;

  enum State {
    SENT,
    INPROGRESS,
    ACCEPTED,
    RECALLED
  }

  struct NFTBundle {
    uint256[] ids;
    address[] contractAddresses;
  }

  struct CoinBundle {
    uint256[] amounts;
    address[] contractAddresses;
  }

  struct Bundle {
    uint256 offeredEther;
    CoinBundle tokens;
    NFTBundle nfts;
  }

  struct TradeOffer {
    address payable offerer;
    address payable target;
    Bundle offerBundle;
    Bundle askBundle;
    State state;
  }

  event TradeOfferCreated(uint256 offerId, address offerer, address target);

  event TradeOfferAccepted(uint256 offerId, address offerer, address target);

  event TradeOfferRecalled(uint256 offerId, address offerer, address target);

  uint256 public offerCount;
  mapping(uint256 => TradeOffer) public offers;

  constructor() {}

  function createOffer(
    address payable _target,
    Bundle calldata offerBundle,
    Bundle calldata askBundle
  ) public payable {
    // Destructure bundles
    uint256 _offerEth = offerBundle.offeredEther;
    address[] memory _offerCoinAddresses = offerBundle.tokens.contractAddresses;
    uint256[] memory _offerCoinAmounts = offerBundle.tokens.amounts;
    address[] memory _offerNFTAddresses = offerBundle.nfts.contractAddresses;
    uint256[] memory _offerNFTIds = offerBundle.nfts.ids;
    uint256 _askEth = askBundle.offeredEther;
    address[] memory _askCoinAddresses = askBundle.tokens.contractAddresses;
    uint256[] memory _askCoinAmounts = askBundle.tokens.amounts;
    address[] memory _askNFTAddresses = askBundle.nfts.contractAddresses;
    uint256[] memory _askNFTIds = askBundle.nfts.ids;

    require(_target != address(0), "Target address is invalid");
    require(
      _offerEth == msg.value,
      "Offer amount is not equal to the ETH sent"
    );
    require(
      _offerCoinAddresses.length == _offerCoinAmounts.length,
      "Offer coin address and amount arrays are not the same length"
    );
    require(
      _offerNFTAddresses.length == _offerNFTIds.length,
      "Offer NFT address and ID arrays are not the same length"
    );
    require(
      _askCoinAddresses.length == _askCoinAmounts.length,
      "Ask coin address and amount arrays are not the same length"
    );
    require(
      _askNFTAddresses.length == _askNFTIds.length,
      "Ask NFT address and ID arrays are not the same length"
    );

    // Create the offer
    offers[offerCount] = TradeOffer(
      payable(msg.sender),
      _target,
      Bundle(
        _offerEth,
        CoinBundle(_offerCoinAmounts, _offerCoinAddresses),
        NFTBundle(_offerNFTIds, _offerNFTAddresses)
      ),
      Bundle(
        _askEth,
        CoinBundle(_askCoinAmounts, _askCoinAddresses),
        NFTBundle(_askNFTIds, _askNFTAddresses)
      ),
      State.SENT
    );

    emit TradeOfferCreated(offerCount, msg.sender, _target);
    offerCount = offerCount.add(1);
  }

  function acceptOffer(uint256 _offerId) public payable {
    TradeOffer memory offer = offers[_offerId];

    require(offer.target == msg.sender, "This offer was not sent to you");
    require(
      offer.askBundle.offeredEther == msg.value,
      "Offer amount is not equal to the amount of ETH sent"
    );
    require(offer.state == State.SENT, "This offer is no longer available");
		require(
      offer.offerBundle.offeredEther <= address(this).balance,
      "Not enough eth in contract!"
    );

    // State should be set before transfer i think https://medium.com/coinmonks/common-attacks-in-solidity-and-how-to-defend-against-them-9bc3994c7c18
    // If anything fails all state changes will be reverted anyways, kind of like a db transaction
    offers[_offerId].state = State.ACCEPTED;

    // Check that the target's assets are approved for the trade, then transfer
    CoinBundle memory askCoins = offer.askBundle.tokens;
    NFTBundle memory askNfts = offer.askBundle.nfts;

    for (uint256 i = 0; i < askCoins.contractAddresses.length; i++) {
      IERC20 coinContract = ERC20(askCoins.contractAddresses[i]);
			uint256 amount = askCoins.amounts[i];

      require(
        coinContract.balanceOf(offer.target) >= askCoins.amounts[i],
        "Not enough tokens"
      );
      require(
        coinContract.allowance(offer.target, address(this)) >=
          amount,
        "Not enough allowed tokens"
      );

			uint256 beforeBalance = coinContract.balanceOf(offer.offerer);
      coinContract.safeTransferFrom(
        offer.target,
        offer.offerer,
        amount
      );
			uint256 afterBalance = coinContract.balanceOf(offer.offerer);
      require(beforeBalance.add(amount) == afterBalance, "Token transfer call did not transfer expected amount");
    }

    for (uint256 i = 0; i < askNfts.contractAddresses.length; i++) {
      ERC721 nftContract = ERC721(askNfts.contractAddresses[i]);

      require(
        nftContract.ownerOf(askNfts.ids[i]) == msg.sender,
        "You no longer own this nft"
      );
      require(
        nftContract.isApprovedForAll(msg.sender, address(this)),
        "Not approved for all NFT transfers"
      );

      nftContract.safeTransferFrom(offer.target, offer.offerer, askNfts.ids[i]);
    }

    // Double check offerer's assets are approved as approvals can be revoked, then transfer
    CoinBundle memory offerCoins = offer.offerBundle.tokens;
    NFTBundle memory offerNfts = offer.offerBundle.nfts;

    for (uint256 i = 0; i < offerCoins.contractAddresses.length; i++) {
      IERC20 coinContract = ERC20(offerCoins.contractAddresses[i]);
      uint256 amount = offerCoins.amounts[i];

      require(
        coinContract.balanceOf(offer.offerer) >= offerCoins.amounts[i],
        "Not enough tokens"
      );
      require(
        coinContract.allowance(offer.offerer, address(this)) >=
          amount,
        "not enough allowed tokens"
      );

			uint256 beforeBalance = coinContract.balanceOf(offer.target);
      coinContract.safeTransferFrom(
        offer.offerer,
        offer.target,
        amount
      );
			uint256 afterBalance = coinContract.balanceOf(offer.target);
      require(beforeBalance.add(amount) == afterBalance, "Token transfer call did not transfer expected amount");
    }

    for (uint256 i = 0; i < offerNfts.contractAddresses.length; i++) {
      ERC721 nftContract = ERC721(offerNfts.contractAddresses[i]);

      require(
        nftContract.ownerOf(offerNfts.ids[i]) == offer.offerer,
        "Not the offerers NFT anymore"
      );
      require(
        nftContract.isApprovedForAll(offer.offerer, address(this)),
        "Not approved for all NFT transfers"
      );

      nftContract.transferFrom(offer.offerer, offer.target, offerNfts.ids[i]);
    }

    payable(offer.offerer).transfer(msg.value);
    payable(offer.target).transfer(offer.offerBundle.offeredEther);

    emit TradeOfferAccepted(_offerId, offer.offerer, offer.target);
  }

  function recallOffer(uint256 _offerId) public {
    require(offers[_offerId].offerer == msg.sender, "Offer not created by you");
    require(
      offers[_offerId].state == State.SENT,
      "Offer is not in the SENT state"
    );
    offers[_offerId].state = State.RECALLED;

    emit TradeOfferRecalled(_offerId, msg.sender, offers[_offerId].target);

    // Return the ETH sent to the contract
    payable(msg.sender).transfer(offers[_offerId].offerBundle.offeredEther);
  }

  // TODO: add a view function to get all offers made to you

  // TODO: add a view function to get all offers made by you

  // TODO: add a view function to check that an offer is valid
}
