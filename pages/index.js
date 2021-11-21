import React, { useState } from "react";
import { css } from "@emotion/react";
import { Flex, Heading, Text, Input } from "@chakra-ui/react";
import Nav from "../components/Nav";
import Layout from "../components/Layout";
import Head from "../components/Head";
import Button from "../components/Button";
import { useRouter } from "next/router";

export default function Home() {
  const [address, setAddress] = useState("");
  const router = useRouter();

  const goToOffer = () => {
    if (address) window.location.href = `/offer/?address=${address}`;
  };

  return (
    <Layout>
      <Head title="Barter Web3" />
      <Nav />
      <Flex p="10" flex="1" alignItems="center" flexDirection="column">
        <Flex
          width={["90%", null, null, null, "50%"]}
          height="100%"
          flexDirection="column"
          alignItems="center"
          pt="98"
          css={css`
            background: linear-gradient(
              168.68deg,
              #19072d 57.44%,
              #406aff 132.55%
            );
            border: 2px solid #ffa6fa;
            box-sizing: border-box;
            box-shadow: 0px 40px 50px rgba(255, 86, 246, 0.58);
            border-radius: 4px;
            padding: 70px;
          `}
        >
          <Heading fontSize={["36", "48", null, null, "52"]} textAlign="center">
            Barter game assets <br /> in the metaverse
          </Heading>
          <Text
            mt="51"
            fontSize={["18", "18", null, null, "24"]}
            textAlign="center"
          >
            Type ethereum adress or ENS to <br /> check out what NFT user holds
          </Text>
          <Input
            val={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && goToOffer()}
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
          <Button width="40%" onClick={() => goToOffer()}>
            Search
          </Button>
        </Flex>
      </Flex>
      <footer></footer>
    </Layout>
  );
}
