import React from "react";
import { Flex, Heading, useColorModeValue } from "@chakra-ui/react";
import Nav from "../components/Nav";
import Layout from "../components/Layout";
import Head from "../components/Head";

export default function Home() {
  return (
    <Layout>
      <Head title="Barter Web3" />
      <Nav />
      <Flex p="10" flex="1">
        <Heading>Solidity Next.js Starter</Heading>
      </Flex>
      <footer></footer>
    </Layout>
  );
}
