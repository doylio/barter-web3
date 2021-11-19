//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract BarterMarket {
  using SafeERC20 for IERC20;

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
    offerCount = offerCount + 1;
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
      "Not enough eth in contract"
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
        "Acceptor does not have enough tokens"
      );
      require(
        coinContract.allowance(offer.target, address(this)) >= amount,
        "Acceptor has not allowed enough tokens"
      );

      uint256 beforeBalance = coinContract.balanceOf(offer.offerer);
      coinContract.safeTransferFrom(offer.target, offer.offerer, amount);
      uint256 afterBalance = coinContract.balanceOf(offer.offerer);
      require(
        beforeBalance + amount == afterBalance,
        "Token transfer call did not transfer expected amount"
      );
    }

    for (uint256 i = 0; i < askNfts.contractAddresses.length; i++) {
      ERC721 nftContract = ERC721(askNfts.contractAddresses[i]);

      require(
        nftContract.ownerOf(askNfts.ids[i]) == msg.sender,
        "Acceptor no longer owns this NFT"
      );
      require(
        nftContract.isApprovedForAll(msg.sender, address(this)),
        "Acceptor has not approved all collections in trade"
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
        "Offerer does not have enough tokens"
      );
      require(
        coinContract.allowance(offer.offerer, address(this)) >= amount,
        "Offerer has not allowed enough tokens"
      );

      uint256 beforeBalance = coinContract.balanceOf(offer.target);
      coinContract.safeTransferFrom(offer.offerer, offer.target, amount);
      uint256 afterBalance = coinContract.balanceOf(offer.target);
      require(
        beforeBalance + amount == afterBalance,
        "Token transfer call did not transfer expected amount"
      );
    }

    for (uint256 i = 0; i < offerNfts.contractAddresses.length; i++) {
      ERC721 nftContract = ERC721(offerNfts.contractAddresses[i]);

      require(
        nftContract.ownerOf(offerNfts.ids[i]) == offer.offerer,
        "Offerer no longer owns an NFT in the trade"
      );
      require(
        nftContract.isApprovedForAll(offer.offerer, address(this)),
        "Offerer has not approved all collections in trade"
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
  function getValidOffersToMe() public view returns (TradeOffer[] memory) {
    TradeOffer[] memory validOffers = new TradeOffer[](offerCount);
    uint256 i = 0;
    for (uint256 j = 0; j < offerCount; j++) {
      if (offers[j].state != State.SENT) continue;
      if (offers[j].target != msg.sender) continue;
      if (!offererTokensAreOwnedAndApproved(j)) continue;
      if (!offererNFTsAreOwnedAndApproved(j)) continue;
      if (!targetHasEnoughTokens(j)) continue;
      if (!targetOwnsNFTs(j)) continue;

      // If it made it this far, it is a valid offer
      validOffers[i] = offers[j];
      i++;
    }

    // Trim the array to the correct size
    TradeOffer[] memory validOffersTrimmed = new TradeOffer[](i);
    for (uint256 j = 0; j < i; j++) {
      validOffersTrimmed[j] = validOffers[j];
    }

    return validOffersTrimmed;
  }

  function getValidOffersFromMe() public view returns (TradeOffer[] memory) {
    TradeOffer[] memory validOffers = new TradeOffer[](offerCount);
    uint256 i = 0;
    for (uint256 j = 0; j < offerCount; j++) {
      if (offers[j].state != State.SENT) continue;
      if (offers[j].offerer != msg.sender) continue;
      if (!offererTokensAreOwnedAndApproved(j)) continue;
      if (!offererNFTsAreOwnedAndApproved(j)) continue;
      if (!targetHasEnoughTokens(j)) continue;
      if (!targetOwnsNFTs(j)) continue;

      // If it made it this far, it is a valid offer
      validOffers[i] = offers[j];
      i++;
    }

    // Trim the array to the correct size
    TradeOffer[] memory validOffersTrimmed = new TradeOffer[](i);
    for (uint256 j = 0; j < i; j++) {
      validOffersTrimmed[j] = validOffers[j];
    }

    return validOffersTrimmed;
  }

  function offererNFTsAreOwnedAndApproved(uint256 _offerId)
    internal
    view
    returns (bool)
  {
    address offerer = offers[_offerId].offerer;
    NFTBundle memory nfts = offers[_offerId].offerBundle.nfts;
    for (uint256 i = 0; i < nfts.contractAddresses.length; i++) {
      ERC721 nftContract = ERC721(nfts.contractAddresses[i]);
      bool isOwner = nftContract.ownerOf(nfts.ids[i]) == offerer;
      bool isApproved = nftContract.isApprovedForAll(offerer, address(this));
      if (!isApproved || !isOwner) {
        return false;
      }
    }
    return true;
  }

  function offererTokensAreOwnedAndApproved(uint256 _offerId)
    internal
    view
    returns (bool)
  {
    address offerer = offers[_offerId].offerer;
    CoinBundle memory coins = offers[_offerId].offerBundle.tokens;
    for (uint256 i = 0; i < coins.contractAddresses.length; i++) {
      ERC20 coinContract = ERC20(coins.contractAddresses[i]);
      uint256 allowance = coinContract.allowance(offerer, address(this));
      uint256 balance = coinContract.balanceOf(offerer);
      if (allowance < coins.amounts[i] || balance < coins.amounts[i]) {
        return false;
      }
    }
    return true;
  }

  function targetHasEnoughTokens(uint256 _offerId)
    internal
    view
    returns (bool)
  {
    CoinBundle memory coins = offers[_offerId].askBundle.tokens;
    for (uint256 i = 0; i < coins.contractAddresses.length; i++) {
      ERC20 coinContract = ERC20(coins.contractAddresses[i]);
      if (coinContract.balanceOf(offers[_offerId].target) < coins.amounts[i]) {
        return false;
      }
    }
    return true;
  }

  function targetOwnsNFTs(uint256 _offerId) internal view returns (bool) {
    NFTBundle memory nfts = offers[_offerId].askBundle.nfts;
    for (uint256 i = 0; i < nfts.contractAddresses.length; i++) {
      ERC721 nftContract = ERC721(nfts.contractAddresses[i]);
      if (nftContract.ownerOf(nfts.ids[i]) != offers[_offerId].target) {
        return false;
      }
    }
    return true;
  }
}
