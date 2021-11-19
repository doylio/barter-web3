import React, { useState, useEffect } from "react";
import { css } from "@emotion/react";
import { Flex, Heading, useToast, Text, Grid, Box } from "@chakra-ui/react";
import { useRouter } from "next/router";

import NFTContainer, { nftContainerSizes } from "../../components/NFTContainer";
import TokenContainer from "../../components/TokenContainer";
import Nav from "../../components/Nav";
import Layout from "../../components/Layout";
import Head from "../../components/Head";
import { useMoralis, useMoralisWeb3Api } from "react-moralis";
import Button from "../../components/Button";
import { trimAddress } from "../../utils/ethereum";

export default function MakeOffer() {
  const router = useRouter();
  const { address } = router.query;

  const [myNFTs, setMyNFTs] = useState(null);
  const [myTokens, setMyTokens] = useState(null);

  // CounterParty
  const [cpNfts, setCPNFTs] = useState(null);
  const [cpTokens, setCPTokens] = useState(null);

  const Web3Api = useMoralisWeb3Api();
  const toast = useToast();
  const { web3, enableWeb3, isWeb3Enabled, user } = useMoralis();

  useEffect(() => {
    if (!isWeb3Enabled) {
      enableWeb3();
    }
  }, [isWeb3Enabled, enableWeb3]);

  async function resolveDomain() {
    if (!isWeb3Enabled) {
      return;
    }
    try {
      if (address.includes(".eth")) {
        const res = await web3.eth.ens.getAddress(address);
        console.log(res);
      }
      return address;
    } catch (err) {
      toast({
        title: "An error occured",
        description: err.message,
        status: "error",
      });
      return address;
    }
  }

  useEffect(() => {
    if (!user) {
      setMyTokens(null);
      setMyNFTs(null);
      return;
    }

    if (!address) {
      setCPTokens(null);
      setCPNFTs(null);
      return;
    }

    if (!address.includes(".eth") && address.length !== 42) {
      return;
    }

    const myAddress = user?.get("ethAddress");

    async function getNFTs() {
      try {
        const counterPartyAddress = await resolveDomain();

        const counterPartyNFTs = await Web3Api.account.getNFTs({
          counterPartyAddress,
          chain: process.env.NEXT_PUBLIC_CHAIN,
        });
        const myNFTs = await Web3Api.account.getNFTs({
          myAddress,
          chain: process.env.NEXT_PUBLIC_CHAIN,
        });

        setCPNFTs(counterPartyNFTs.result);
        setMyNFTs(myNFTs.result);
      } catch (err) {
        setCPNFTs(null);
        setMyNFTs(null);
      }
    }

    async function getTokens() {
      try {
        const counterPartyAddress = await resolveDomain();
        const counterPartyTokens = await Web3Api.account.getTokenBalances({
          counterPartyAddress,
          chain: process.env.NEXT_PUBLIC_CHAIN,
        });
        const myTokens = await Web3Api.account.getTokenBalances({
          myAddress,
          chain: process.env.NEXT_PUBLIC_CHAIN,
        });
        setCPTokens(counterPartyTokens);
        setMyTokens(myTokens);
      } catch (err) {
        setCPTokens(null);
      }
    }

    getNFTs();
    getTokens();
  }, [address, user]);

  return (
    <Layout>
      <Head title="Barter Web3 - Make Offer" />
      <Nav />
      <Flex
        width="100%"
        p="20"
        flex="1"
        alignItems="space-between"
        flexDirection="row"
      >
        {/* My Offer Column */}
        <Flex flex="2" flexDirection="column">
          <Heading size="lg">Make your offer</Heading>
          <Flex flexDirection="column">
            <TokensGrid tokens={myTokens} />
            <NFTsGrid nfts={myNFTs} />
            <Flex flexDirection="column"></Flex>
          </Flex>
        </Flex>

        {/* Offer CTA  */}
        <Flex
          alignItems="center"
          justify="center"
          flex="1.5"
          flexDirection="column"
        >
          <Flex flexDirection="column" maxWidth="70%" alignItems="center">
            <Text fontWeight="700" textAlign="center">
              You're offering 40 DAI and 1 NFT from Axie Infinity
            </Text>
            <Box mt="10" mb="10">
              <img src="/arrows.svg" />
            </Box>
            <Button width="70%">Offer barter</Button>
          </Flex>
        </Flex>
        {/* Counterparty Column */}
        <Flex flex="2" flexDirection="column">
          <Heading size="lg">
            Assets owned by{" "}
            <span style={{ color: "#3bace2" }}>{trimAddress(address)}</span>
          </Heading>
          <Flex flexDirection="column">
            <TokensGrid isOwner={false} tokens={cpTokens} />
            <NFTsGrid isOwner={false} nfts={cpNfts} />
            <Flex flexDirection="column"></Flex>
          </Flex>
        </Flex>
      </Flex>
    </Layout>
  );
}

const TokensGrid = ({ tokens, isOwner = true }) => {
  if (tokens && tokens.length !== 0) {
    return (
      <Flex mt="10" flexDirection="column">
        <Text fontSize="xl" fontWeight="600">
          {isOwner ? "Your ERC-20 offer" : "Counterparty ERC-20"}
        </Text>

        <Grid templateColumns={["repeat(1, 1fr)"]} gap={2}>
          {tokens.map((token, idx) => (
            <TokenContainer key={idx} token={token} />
          ))}
        </Grid>
      </Flex>
    );
  }
  return null;
};

const NFTsGrid = ({ nfts, isOwner = true }) => {
  if (nfts && nfts.length !== 0) {
    return (
      <Flex mt="10" flexDirection="column">
        <Text fontSize="xl" fontWeight="600" mb="10">
          {isOwner ? "Your NFTs offer" : "Counterparty NFTs"}
        </Text>

        <Grid templateColumns={["repeat(2, 1fr)"]} gap={2}>
          {nfts.map((nft, idx) => (
            <NFTContainer
              size={nftContainerSizes.sm}
              key={idx}
              metadata={nft.metadata}
              name={nft.name}
            />
          ))}
        </Grid>
      </Flex>
    );
  }

  return null;
};
