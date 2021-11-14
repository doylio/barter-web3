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
        Bundle calldata offerBundle,
        Bundle calldata askBundle
    ) public payable {
        // Destructure bundles
        uint256 _offerEth = offerBundle.offeredEther;
        address[] memory _offerCoinAddresses = offerBundle
            .tokens
            .contractAddresses;
        uint256[] memory _offerCoinAmounts = offerBundle.tokens.amounts;
        address[] memory _offerNFTAddresses = offerBundle
            .nfts
            .contractAddresses;
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

        // Check that enough tokens have been approved
        for (uint256 i = 0; i < _offerCoinAddresses.length; i++) {
            ERC20 coinContract = ERC20(_offerCoinAddresses[i]);
            require(
                coinContract.allowance(msg.sender, address(this)) >=
                    _offerCoinAmounts[i] +
                        committedTokens[msg.sender][_offerCoinAddresses[i]],
                "Not enough tokens to make the offer"
            );
            committedTokens[msg.sender][
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

    // TODO: add a function to accept an offer from another address
    // Check that all assets have been approved for transfer
    // Check that ETH balances are sufficient
    // Check that the offer is still in the SENT state
    // Send the ETH, tokens and NFTs to the target
    // Sent the ETH, tokens and NFTs to the offerer
    // Reset committed tokens and NFTs
    // Change the state to ACCEPTED
    // Emit an event of a TradeOffer being accepted

    function recallOffer(uint256 _offerId) public {
        require(
            offers[_offerId].offerer == msg.sender,
            "Offer not created by you"
        );
        require(
            offers[_offerId].state == State.SENT,
            "Offer is not in the SENT state"
        );
        offers[_offerId].state = State.RECALLED;

        // Remove offered amount from committed coins
        CoinBundle memory offerCoins = offers[_offerId].offerBundle.tokens;
        for (uint256 i = 0; i < offerCoins.contractAddresses.length; i++) {
            committedTokens[msg.sender][
                offerCoins.contractAddresses[i]
            ] -= offerCoins.amounts[i];
        }

        // Remove NFTs from committed NFTs
        NFTBundle memory offerNfts = offers[_offerId].offerBundle.nfts;
        for (uint256 i = 0; i < offerNfts.contractAddresses.length; i++) {
            committedNFTs[offerNfts.contractAddresses[i]][
                offerNfts.ids[i]
            ] = false;
        }

        emit TradeOfferRecalled(_offerId, msg.sender, offers[_offerId].target);

        // Return the ETH sent to the contract
        payable(msg.sender).transfer(offers[_offerId].offerBundle.offeredEther);
    }

    // TODO: add a view function to get all offers made to you

    // TODO: add a view function to get all offers made by you
}
