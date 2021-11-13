//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

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

  uint256 public offerCount;
  mapping(uint256 => TradeOffer) public offers;

  constructor() {}

  // TODO: add a function to make an offer to another address
  // Creates a new TradeOffer
  // Emit an event of a TradeOffer being created
  // Send an ETH to the contract

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
}
