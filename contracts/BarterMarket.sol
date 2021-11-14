//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract BarterWalletFactory {
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
  // walletAddress => erc20Address => amount
  mapping(address => mapping(address => uint256)) public committedTokens;
  // erc721Address => tokenId => approved
  mapping(address => mapping(uint256 => bool)) public committedNFTs;

  constructor() {}

  function createOffer(
    address payable _target,
    uint256 _offerEth,
    address[] calldata _offerCoinAddresses,
    uint256[] calldata _offerCoinAmounts,
    address[] calldata _offerNFTAddresses,
    uint256[] calldata _offerNFTIds,
    uint256 _askEth,
    address[] calldata _askCoinAddresses,
    uint256[] calldata _askCoinAmounts,
    address[] calldata _askNFTAddresses,
    uint256[] calldata _askNFTIds
  ) public payable {
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

    // Check that enough tokens have been approved
    for (uint256 i = 0; i < _offerCoinAddresses.length; i++) {
      ERC20 coinContract = ERC20(_offerCoinAddresses[i]);
      require(
        coinContract.allowance(msg.sender, address(this)) >=
          _offerCoinAmounts[i] +
            committedTokens[msg.sender][_offerCoinAddresses[i]],
        "Not enough tokens to make the offer"
      );
      committedTokens[msg.sender][_offerCoinAddresses[i]] += _offerCoinAmounts[
        i
      ];
    }

    // Check that NFTs have been approved
    for (uint256 i = 0; i < _offerNFTAddresses.length; i++) {
      ERC721 nftContract = ERC721(_offerNFTAddresses[i]);
      require(
        nftContract.ownerOf(_offerNFTIds[i]) == msg.sender,
        "Not your NFT"
      );
      require(
        nftContract.isApprovedForAll(msg.sender, address(this)),
        "Not approved for all NFT transfers"
      );
      require(
        committedNFTs[_offerNFTAddresses[i]][_offerNFTIds[i]] == false,
        "Already committed to another offer"
      );
      committedNFTs[_offerNFTAddresses[i]][_offerNFTIds[i]] = true;
    }

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
    offerCount += 1;
  }

	function acceptOffer(uint256 _offerId) public payable {
		TradeOffer memory offer = offers[_offerId];

		require(
			offer.target == msg.sender, 
			"This offer was not sent to you"
		);
		require(
			offer.askBundle.offeredEther == msg.value,
			"Offer amount is not equal to the amount of ETH sent"
		);
		require(
			offer.state == State.SENT,
			"This offer is no longer available"
		);

		// Check that the target's assets are approved for the trade
		CoinBundle memory askCoins = offer.askBundle.tokens;			
		NFTBundle memory askNfts = offer.askBundle.nfts;

		for (uint256 i = 0; i < askCoins.contractAddresses.length; i++) {
			ERC20 coinContract = ERC20(askCoins.contractAddresses[i]);
			require(
				coinContract.allowance(msg.sender, address(this)) >=
					askCoins.amounts[i] +
						committedTokens[msg.sender][askCoins.contractAddresses[i]],
				"Not enough tokens to accept this offer"
			);
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
			require(
				committedNFTs[askNfts.contractAddresses[i]][askNfts.ids[i]] == false,
				"Already committed to another offer"
			);
		}

		// Double check offerer's assets are approved as approvals can be revoked
		CoinBundle memory offerCoins = offer.offerBundle.tokens;
		NFTBundle memory offerNfts = offer.offerBundle.nfts;

		for (uint256 i = 0; i < offerCoins.contractAddresses.length; i++) {
			ERC20 coinContract = ERC20(offerCoins.contractAddresses[i]);
			require(
				coinContract.allowance(offer.offerer, address(this)) >=
					offerCoins.amounts[i],
				"offerer doesn't have enough tokens to complete the trade anymore"
			);
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
    }

		// State should be set before transfer i think https://medium.com/coinmonks/common-attacks-in-solidity-and-how-to-defend-against-them-9bc3994c7c18
		offers[_offerId].state = State.ACCEPTED;

		// Send the offer to the target
		for (uint256 i = 0; i < offerCoins.contractAddresses.length; i++) {
			committedTokens[offer.offerer][offerCoins.contractAddresses[i]] -= offerCoins.amounts[i];
			ERC20 coinContract = ERC20(offerCoins.contractAddresses[i]);
			coinContract.transferFrom(offer.offerer, offer.target, offerCoins.amounts[i]);
		}

		for (uint256 i = 0; i < offerNfts.contractAddresses.length; i++) {
			committedNFTs[offerNfts.contractAddresses[i]][offerNfts.ids[i]] = false;
			ERC721 nftContract = ERC721(offerNfts.contractAddresses[i]);
			nftContract.transferFrom(offer.offerer, offer.target, offerNfts.ids[i]);
		}

		// Send the ask to the offerer
		for (uint256 i = 0; i < askCoins.contractAddresses.length; i++) {
			ERC20 coinContract = ERC20(askCoins.contractAddresses[i]);
			coinContract.transferFrom(offer.offerer, offer.target, askCoins.amounts[i]);
		}

		for (uint256 i = 0; i < askNfts.contractAddresses.length; i++) {
			ERC721 nftContract = ERC721(askNfts.contractAddresses[i]);
			nftContract.transferFrom(offer.offerer, offer.target, askNfts.ids[i]);
		}

		require(
       offer.askBundle.offeredEther + offer.offerBundle.offeredEther <= address(this).balance,
      "Not enough eth in contract"
    );
		payable(offer.offerer).transfer(offer.askBundle.offeredEther);
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

    // Remove offered amount from committed coins
    CoinBundle memory offerCoins = offers[_offerId].offerBundle.tokens;
    for (uint256 i = 0; i < offerCoins.contractAddresses.length; i++) {
      committedTokens[msg.sender][offerCoins.contractAddresses[i]] -= offerCoins
        .amounts[i];
    }

    // Remove NFTs from committed NFTs
    NFTBundle memory offerNfts = offers[_offerId].offerBundle.nfts;
    for (uint256 i = 0; i < offerNfts.contractAddresses.length; i++) {
      committedNFTs[offerNfts.contractAddresses[i]][offerNfts.ids[i]] = false;
    }

    emit TradeOfferRecalled(_offerId, msg.sender, offers[_offerId].target);

    // Return the ETH sent to the contract
    payable(msg.sender).transfer(offers[_offerId].offerBundle.offeredEther);
  }

  // TODO: add a view function to get all offers made to you

  // TODO: add a view function to get all offers made by you
}
