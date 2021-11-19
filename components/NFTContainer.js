import React, { useState, useEffect } from "react";
import { Flex, Text, Box } from "@chakra-ui/react";
import { css } from "@emotion/react";

export const nftContainerSizes = {
  sm: {
    height: "15em",
    width: "11em",
  },
  md: {
    height: "20em",
    width: "15em",
  },
};

const NFTContainer = ({ nft, size = nftContainerSizes.md }) => {
  const [metadata, setMetadata] = useState(null);
  const [imageURL, setImageURL] = useState(null);

  async function fetchMetadata() {
    let metadata;

    if (nft.metadata) {
      metadata = nft.metadata;
    } else if (nft.token_uri) {
      const res = await fetch(nft.token_uri, { method: "GET" });

      metadata = {
        name: res.name,
        image: res.image,
      };
    } else {
      metadata = null;
    }

    setMetadata(metadata);
  }

  async function parseMetadata() {
    try {
      const parsedMetadata =
        typeof metadata === "string" ? JSON.parse(metadata) : metadata;

      if (!parsedMetadata) {
        return null;
      }

      let imageURL = parsedMetadata?.image;

      if (parsedMetadata?.image.includes("ipfs://")) {
        const IPFS_BASE_URL = "https://ipfs.io/ipfs/";
        const normalizedURL = parsedMetadata.image.replace("ipfs/", "");
        imageURL = IPFS_BASE_URL + normalizedURL.split("ipfs://")[1];
      }

      setImageURL(imageURL);
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (metadata) {
      parseMetadata();
    }
  }, [metadata]);

  if (metadata) {
    return (
      <Flex
        alignItems="center"
        flexDirection="column"
        height={size.height}
        width={size.width}
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
              {metadata.name ? metadata.name : nft.name}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    );
  } else {
    return null;
  }
};

export default NFTContainer;
