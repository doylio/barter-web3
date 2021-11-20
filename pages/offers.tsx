import React, { useState, FC } from "react";
import { Flex, Text, Box, Heading } from "@chakra-ui/react";
import Nav from "../components/Nav";
import Layout from "../components/Layout";
import Head from "../components/Head";
import Button from "../components/Button";
import { css } from "@emotion/react";

export default function Offers() {
  const [sent, setSent] = useState<boolean>(false);

  const changeView = () => {
    setSent((val) => !val);
  };

  return (
    <Layout>
      <Head title="Barter Web3" description="hi" />
      <Nav />
      <Flex
        justifyContent="space-between"
        alignItems="center"
        pr="40px"
        pl="40px"
      >
        <Heading>{sent ? "Sent Offers" : "Received Offers"}</Heading>
        <Button width="auto" onClick={changeView}>
          {sent ? "View Received Offers" : "View Sent Offers"}
        </Button>
      </Flex>
      <Flex
        p="10"
        flex="1"
        alignItems="center"
        flexDirection="column"
        justifyContent="center"
      >
        <Offer sent={sent} />
        <Offer sent={sent} />
        <Offer sent={sent} />
      </Flex>
      <footer></footer>
    </Layout>
  );
}

const Offer: FC<{ sent: boolean }> = ({ sent }) => {
  return (
    <Flex
      width={"100%"}
      height="100%"
      minH="500px"
      maxW="1000px"
      mb="40px"
      flexDirection="column"
      alignItems="center"
      css={css`
        background: linear-gradient(168.68deg, #19072d 57.44%, #406aff 132.55%);
        border: 2px solid #ffa6fa;
        box-sizing: border-box;
        box-shadow: 0px 40px 50px rgba(255, 86, 246, 0.58);
        border-radius: 4px;
      `}
    >
      <Flex
        alignItems="stretch"
        justifyContent="space-between"
        width="100%"
        height="100%"
      >
        <Flex
          flexDirection="column"
          flex={1}
          justifyContent="flex-start"
          alignItems="stretch"
          pt="40px"
          pl="40px"
          pb="40px"
        >
          <Box>
            <Text
              cursor="pointer"
              color="white"
              fontSize="2xl"
              fontWeight="800"
            >
              Incoming offer from
            </Text>{" "}
            <Text
              cursor="pointer"
              color="#3BACE2
									"
              fontSize="2xl"
              fontWeight="800"
              mb="10px"
            >
              0xcfaf2....a101d{" "}
            </Text>
          </Box>
          <Box>
            <Text
              cursor="pointer"
              color="white"
              fontSize="2xl"
              fontWeight="400"
              mb="10px"
            >
              ERC-20
            </Text>{" "}
          </Box>
          <Box>
            <Text
              cursor="pointer"
              color="white"
              fontSize="2xl"
              fontWeight="400"
              mb="10px"
            >
              NFTs
            </Text>{" "}
          </Box>
        </Flex>
        <Flex
          flexDirection="column"
          flex={1}
          justifyContent="center"
          alignItems="stretch"
        >
          <Flex
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
          >
            {sent ? (
              <>
                <Box mt="6" mb="6">
                  <img src="/pending.svg" />
                </Box>
                <Text
                  cursor="pointer"
                  color="white"
                  fontSize="lg"
                  fontWeight="400"
                  align="center"
                >
                  Offer pending approval from 0xcfaf2....a101d
                </Text>
              </>
            ) : (
              <>
                <Box mt="6" mb="6">
                  <img src="/arrows.svg" />
                </Box>
                <Button width="80%" onClick={() => {}} mb={5}>
                  Accept
                </Button>
                <Button width="80%" onClick={() => {}} warning>
                  Decline
                </Button>
              </>
            )}
          </Flex>
        </Flex>
        <Flex
          flexDirection="column"
          flex={1}
          justifyContent="flex-start"
          alignItems="stretch"
          pt="40px"
          pr="40px"
          pb="40px"
        >
          <Box>
            <Text
              cursor="pointer"
              color="white"
              fontSize="2xl"
              fontWeight="800"
            >
              Their Request
            </Text>{" "}
          </Box>
          <Box>
            <Text
              cursor="pointer"
              color="white"
              fontSize="2xl"
              fontWeight="400"
              mb="10px"
            >
              ERC-20
            </Text>{" "}
          </Box>
          <Box>
            <Text
              cursor="pointer"
              color="white"
              fontSize="2xl"
              fontWeight="400"
              mb="10px"
            >
              NFTs
            </Text>{" "}
          </Box>
        </Flex>
      </Flex>
    </Flex>
  );
};
