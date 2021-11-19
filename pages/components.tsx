import React, { useState, useEffect } from "react";
import { css } from "@emotion/react";
import {
  Flex,
  Heading,
  useToast,
  Input,
  Grid,
  Text,
  Box,
} from "@chakra-ui/react";
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
        return await web3.eth.ens.getAddress(ethAddress);
      }
      return ethAddress;
    } catch (err) {
      return ethAddress;
    }
  }

  useEffect(() => {
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
              {tokens.map((token) => (
                <TokenContainer token={token} />
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
              {nfts.map((nft) => (
                <NFTContainer metadata={nft.metadata} name={nft.name} />
              ))}
            </Grid>
          </Flex>
        ) : null}
      </Flex>
    </Layout>
  );
}

const TokenContainer = ({ token }) => {
  if (!token) {
    return null;
  }

  const amount =
    token.decimals === "0"
      ? token.balance
      : (parseFloat(token.balance) / 10 ** parseFloat(token.decimals)).toFixed(
          2
        );

  return (
    <Flex
      mb="5"
      p="3"
      borderRadius={4}
      alignItems="center"
      css={css`
        background: #1e0938;
        backdrop-filter: blur(134.882px);
      `}
    >
      {token.logo && (
        <img style={{ width: "2em", marginRight: "1em" }} src={token.logo} />
      )}
      <Text fontWeight="700">
        {amount} {token.symbol}
      </Text>
    </Flex>
  );
};

const NFTContainer = ({ metadata, name }) => {
  try {
    const parsedMetadata = JSON.parse(metadata);

    if (!parsedMetadata) {
      return null;
    }

    let imageURL = parsedMetadata?.image;

    if (parsedMetadata?.image.includes("ipfs://")) {
      const IPFS_BASE_URL = "https://ipfs.io/ipfs/";
      const normalizedURL = parsedMetadata.image.replace("ipfs/", "");
      imageURL = IPFS_BASE_URL + normalizedURL.split("ipfs://")[1];
    }

    return (
      <Flex
        alignItems="center"
        flexDirection="column"
        height="20em"
        width="15em"
        borderRadius="4"
        css={css`
          background: #1e0938;
          backdrop-filter: blur(134.882px);
        `}
      >
        <Box
          height="15em"
          width="100%"
          borderTopRadius="4"
          backgroundPosition="center"
          backgroundRepeat="no-repeat"
          backgroundSize="cover"
          backgroundImage={imageURL}
        />
        <Flex mt="5" width="80%">
          <Flex justifyContent="center" width="100%" height="100%" p="2">
            <Text textAlign="center" fontWeight="700">
              {parsedMetadata.name ? parsedMetadata.name : name}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    );
  } catch (err) {
    return null;
  }
};
