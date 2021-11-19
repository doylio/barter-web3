import React from "react";
import { css } from "@emotion/react";
import { Flex, Heading, Text, Input } from "@chakra-ui/react";
import Nav from "../components/Nav";
import Layout from "../components/Layout";
import Head from "../components/Head";
import Button from "../components/Button";
import Container from "../components/Container";

export default function Home() {
  return (
    <Layout>
      <Head title="Barter Web3" />
      <Nav />
      <Flex p="10" flex="1" alignItems="center" flexDirection="column">
        <Container>
          <>
            <Heading
              fontSize={["36", "48", null, null, "52"]}
              textAlign="center"
            >
              Barter game assets <br /> in the metaverse
            </Heading>
            <Text
              mt="51"
              fontSize={["18", "18", null, null, "24"]}
              textAlign="center"
            >
              Type ethereum adress or ENS to <br /> check out what NFT user
              holds
            </Text>
            <Input
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
            <Button width="40%">Search</Button>
          </>
        </Container>
      </Flex>
      <footer></footer>
    </Layout>
  );
}
