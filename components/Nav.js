import React, { useState, useEffect } from "react";
import { Flex, Text, Box } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useMoralis } from "react-moralis";

import { hasEthereum, trimAddress } from "../utils/ethereum";
import Button from "./Button";
import { addressToEns } from "../utils/ens";

const Nav = ({ goToOffers, goToHome }) => {
  const [connectedWalletAddress, setConnectedWalletAddressState] = useState("");
  const { authenticate, isAuthenticated, user } = useMoralis();

  // If wallet is already connected...
  useEffect(() => {
    if (!hasEthereum()) {
      setConnectedWalletAddressState(`MetaMask unavailable`);
      return;
    }
    async function setConnectedWalletAddress() {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      try {
        const signerAddress = await signer.getAddress();
        const resolvedAddress = await resolveAddress(signerAddress);
        setConnectedWalletAddressState(resolvedAddress);
      } catch (err) {
        console.log(err);
        setConnectedWalletAddressState(null);
        return;
      }
    }
    setConnectedWalletAddress();
  }, [isAuthenticated]);

  async function resolveAddress(address) {
    const ensName = await addressToEns(address);
    if (ensName) return ensName;
    return trimAddress(address);
  }

  return (
    <Flex p="5" width="100%" justifyContent="space-between">
      <Text
        cursor="pointer"
        color="white"
        fontSize="2xl"
        fontWeight="800"
        onClick={goToHome}
      >
        BarterWeb3
      </Text>

      <Flex alignItems="center" flexDirection="row">
        <Text
          cursor="pointer"
          color="white"
          fontWeight="700"
          mr="20px"
          onClick={goToOffers}
        >
          View Offers
        </Text>
        {isAuthenticated && connectedWalletAddress ? (
          <Text fontWeight="700" mr="5">
            {connectedWalletAddress}
          </Text>
        ) : (
          <Button onClick={authenticate}>Connect Wallet</Button>
        )}
      </Flex>
    </Flex>
  );
};

export default Nav;
