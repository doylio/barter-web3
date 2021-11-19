import React from "react";
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
const NFTContainer = ({ metadata, name, size = nftContainerSizes.md }) => {
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

export default NFTContainer;
