import React, { useState, useEffect } from "react";
import { css } from "@emotion/react";
import { Flex, Heading, useToast, Input, Grid } from "@chakra-ui/react";

import NFTContainer from "../components/NFTContainer";
import TokenContainer from "../components/TokenContainer";
import Nav from "../components/Nav";
import Layout from "../components/Layout";
import Head from "../components/Head";
import {
  useMoralis,
  useMoralisWeb3Api,
  useMoralisWeb3ApiCall,
} from "react-moralis";

export default function Home() {
  const [ethAddress, setEthAddress] = useState("");
  const [nfts, setNFTs] = useState(null);
  const [tokens, setTokens] = useState(null);

  const Web3Api = useMoralisWeb3Api();
  const toast = useToast();
  const { web3, enableWeb3, isWeb3Enabled } = useMoralis();

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
      if (ethAddress.includes(".eth")) {
        const res = await web3.eth.ens.getAddress(ethAddress);
        console.log(res);
      }
      return ethAddress;
    } catch (err) {
      toast({
        title: "An error occured",
        description: err.message,
        status: "error",
      });
      return ethAddress;
    }
  }

  useEffect(() => {
    if (!ethAddress) {
      setTokens(null);
      setNFTs(null);
    }

    if (!ethAddress.includes(".eth") && ethAddress.length !== 42) {
      return;
    }
    async function getNFTs() {
      try {
        const address = await resolveDomain();
        const userEthNFTs = await Web3Api.account.getNFTs({
          address,
          chain: process.env.NEXT_PUBLIC_CHAIN,
        });

        setNFTs(userEthNFTs.result);
      } catch (err) {
        setNFTs(null);
      }
    }

    async function getTokens() {
      try {
        const address = await resolveDomain();
        const userTokens = await Web3Api.account.getTokenBalances({
          address,
          chain: process.env.NEXT_PUBLIC_CHAIN,
        });
        setTokens(userTokens);
      } catch (err) {
        setTokens(null);
      }
    }

    getNFTs();
    getTokens();
  }, [ethAddress]);

  return (
    <Layout>
      <Head title="Barter Web3 - Components" />
      <Nav />
      <Flex p="10" flex="1" alignItems="center" flexDirection="column">
        <Heading>Components</Heading>

        <Input
          value={ethAddress}
          onChange={async (e) => {
            setEthAddress(e.target.value);
          }}
          height="60px"
          mt="50"
          mb="30"
          css={css`
            background: #ffffff;
            border-radius: 2px;
            color: rgba(60, 121, 213);
            font-weight: 700;

            ::placeholder {
              color: rgba(60, 121, 213);
              font-weight: 700;
            }
          `}
          width="40%"
          placeholder="Address / ENS"
        />
        {tokens && tokens.length !== 0 ? (
          <Flex
            width="80%"
            mb="10"
            flexDirection="column"
            alignItems="flex-start"
          >
            <Heading mb="10">ERC20</Heading>
            <Grid
              templateColumns={["repeat(2, 1fr)", null, "repeat(4, 1fr)"]}
              gap={6}
            >
              {tokens.map((token, idx) => (
                <TokenContainer key={idx} token={token} />
              ))}
            </Grid>
          </Flex>
        ) : null}
        {nfts && nfts.length !== 0 ? (
          <Flex width="80%" flexDirection="column">
            <Heading mb="10">NFTs</Heading>
            <Grid
              templateColumns={[
                "repeat(1, 1fr)",
                "repeat(2, 1fr)",
                "repeat(3, 1fr)",
                "repeat(4, 1fr)",
              ]}
              gap={6}
            >
              {nfts.map((nft, idx) => (
                <NFTContainer
                  key={idx}
                  metadata={nft.metadata}
                  name={nft.name}
                />
              ))}
            </Grid>
          </Flex>
        ) : null}
      </Flex>
    </Layout>
  );
}
