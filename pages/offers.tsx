import React, { useState, useEffect } from "react";
import { Flex, Heading, Spinner, useToast } from "@chakra-ui/react";
import Nav from "../components/Nav";
import Layout from "../components/Layout";
import Head from "../components/Head";
import Button from "../components/Button";
import barter from "../artifacts/contracts/BarterMarket.sol/BarterMarket.json";
import { ethers } from "ethers";
import { useMoralis } from "react-moralis";
import Offer from "../components/Offer";

const contractAddress = "0x10E62cFbb59e4fE4319c026ec5Ec19de90665a2d";

export default function Offers() {
  const [sent, setSent] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const { authenticate, isAuthenticated, user } = useMoralis();
  const [offers, setOffers] = useState([]);
  const toast = useToast();

  const changeView = () => {
    setSent((val) => !val);
  };

  const grabOffers = async () => {
    try {
      const { ethereum } = window as any;

      if (ethereum) {
        setLoadingOffers(true);
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          contractAddress,
          barter.abi,
          signer
        );

        const promise = sent
          ? contract.getOffersFromMe()
          : contract.getOffersToMe();
        const offers = await promise;

        setOffers(offers);
      }
    } catch (error) {
      toast({
        title: "An error occured",
        description: error.message,
        status: "error",
      });
    }

    setLoadingOffers(false);
  };

  useEffect(() => {
    console.log("In UseEffect!");
    grabOffers();
  }, [sent]);

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
        {loadingOffers ? (
          <Spinner size="xl" color="white" />
        ) : (
          <>
            {offers.map((offer, i) => (
              <Offer
                sent={sent}
                offer={offer}
                key={i}
                refreshData={grabOffers}
              />
            ))}
          </>
        )}
      </Flex>

      <footer></footer>
    </Layout>
  );
}
