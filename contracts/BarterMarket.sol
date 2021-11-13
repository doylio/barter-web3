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
    REJECTED
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
  mapping(address => mapping(address => uint256)) public coinsApprovedInOffers;
  // walletAddress => erc721Address => => tokenId => approved
  mapping(address => mapping(address => mapping(uint256 => bool)))
    public nftsApprovedInOffers;

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
            coinsApprovedInOffers[msg.sender][_offerCoinAddresses[i]],
        "Not enough tokens to make the offer"
      );
      coinsApprovedInOffers[msg.sender][
        _offerCoinAddresses[i]
      ] += _offerCoinAmounts[i];
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
        nftsApprovedInOffers[msg.sender][_offerNFTAddresses[i]][
          _offerNFTIds[i]
        ] == false,
        "Already committed to another offer"
      );
      nftsApprovedInOffers[msg.sender][_offerNFTAddresses[i]][
        _offerNFTIds[i]
      ] = true;
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

  // TODO: add a function to accept an offer from another address
  // Check that all assets have been approved for transfer
  // Check that ETH balances are sufficient
  // Check that the offer is still in the SENT state
  // Update the state to INPROGRESS
  // Emit an event of a TradeOffer being accepted
  // Send the tokens to the target address
  // Send the NFTs to the target address
  // Send the ETH to the target address
  // Send the tokens to the offerer address
  // Send the NFTs to the offerer address
  // Send the ETH to the offerer address

  // TODO: add a function to recind offer you already made
  // Check that the offer is in a state of SENT or INPROGRESS
  // Change the state to REJECTED
  // Emit an event of the offer being rejected

  // TODO: add a view function to get all offers made to you

  // TODO: add a view function to get all offers made by you
}
