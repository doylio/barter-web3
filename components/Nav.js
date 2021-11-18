import React, { useState, useEffect } from "react";
import { Flex, Text, Box } from "@chakra-ui/react";
import { ethers } from "ethers";
import Link from "next/link";

import { hasEthereum } from "../utils/ethereum";
import Button from "./Button";

const Nav = () => {
  const [connectedWalletAddress, setConnectedWalletAddressState] = useState("");

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
        setConnectedWalletAddressState(`Connected wallet: ${signerAddress}`);
      } catch {
        setConnectedWalletAddressState(null);
        return;
      }
    }
    setConnectedWalletAddress();
  }, []);

  // Request access to MetaMask account
  async function requestAccount() {
    await window.ethereum.request({ method: "eth_requestAccounts" });
  }
  return (
    <Flex p="5" width="100%" justifyContent="space-between">
      <Link href="/">
        <Text cursor="pointer" color="white" fontSize="2xl" fontWeight="800">
          BarterWeb3
        </Text>
      </Link>
      <Box>
        <Button onClick={requestAccount}>Connect Wallet</Button>
        <div>
          <div>{connectedWalletAddress && <p>{connectedWalletAddress}</p>}</div>
        </div>
      </Box>
    </Flex>
  );
};

export default Nav;
