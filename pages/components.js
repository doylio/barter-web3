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
import { useMoralisWeb3Api } from "react-moralis";

export default function Home() {
  const [ethAddress, setEthAddress] = useState("");
  const [nfts, setNFTs] = useState(null);

  const Web3Api = useMoralisWeb3Api();
  const toast = useToast();

  useEffect(() => {
    async function getNFTs() {
      try {
        const userEthNFTs = await Web3Api.account.getNFTs({
          address: ethAddress,
        });
        console.log(userEthNFTs);
        setNFTs(userEthNFTs.result);
      } catch (err) {
        console.log(err);
        setNFTs(null);
      }
    }
    getNFTs();
  }, [ethAddress]);

  return (
    <Layout>
      <Head title="Barter Web3 - Components" />
      <Nav />
      <Flex p="10" flex="1" alignItems="center" flexDirection="column">
        <Heading>Components</Heading>

        <Input
          value={ethAddress}
          onChange={(e) => setEthAddress(e.target.value)}
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
        {nfts.length !== 0 ? (
          <Flex flexDirection="column">
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
                <NFTContainer metadata={nft.metadata} />
              ))}
            </Grid>
          </Flex>
        ) : null}
      </Flex>
    </Layout>
  );
}

const NFTContainer = ({ metadata }) => {
  //   console.log("metadata", metadata);
  const parsedMetadata = JSON.parse(metadata);
  //   console.log("pmetadata", parsedMetadata);

  if (!parsedMetadata) {
    return null;
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
        backgroundImage={parsedMetadata.image}
      />
      <Flex mt="5" width="80%">
        <Flex justifyContent="center" width="100%" height="100%" p="2">
          <Text fontWeight="700">{parsedMetadata.name}</Text>
        </Flex>
      </Flex>
    </Flex>
  );
};
