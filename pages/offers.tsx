import React, { useState, FC, useEffect } from "react";
import { Flex, Text, Box, Heading, Spinner, Grid } from "@chakra-ui/react";
import Nav from "../components/Nav";
import Layout from "../components/Layout";
import Head from "../components/Head";
import Button from "../components/Button";
import { css } from "@emotion/react";
import barter from "../artifacts/contracts/BarterMarket.sol/BarterMarket.json";
import ERC721 from "../artifacts/contracts/MockERC721.sol/MockERC721.json";
import ERC20 from "../artifacts/contracts/MockERC20.sol/MockERC20.json";
import { useMoralis } from "react-moralis";
import { ethers } from "ethers";
import { trimAddress } from "../utils/ethereum";

const contractAddress = "0x10E62cFbb59e4fE4319c026ec5Ec19de90665a2d";

export default function Offers() {
  const [sent, setSent] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const { authenticate, isAuthenticated, user } = useMoralis();
  const [offers, setOffers] = useState([]);

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

        let offers;

        console.log("Hitting contract");

        if (sent) {
          offers = await contract.getOffersFromMe();
        } else {
          offers = await contract.getOffersToMe();
        }

        console.log("Here's the transaction baby");
        console.log(offers);
        setOffers(offers);
      }
    } catch (error) {
      console.error("Error:", error);
    }

    setLoadingOffers(false);
  };

  useEffect(() => {
    console.log("In UseEffect!");
    grabOffers();
  }, [sent]);

  useEffect(() => {
    const makeOffer = async () => {
      const { ethereum } = window as any;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          contractAddress,
          barter.abi,
          signer
        );
        const offerBundle = {
          offeredEther: ethers.utils.parseEther("0"),
          tokens: {
            amounts: [],
            contractAddresses: [],
          },
          nfts: {
            ids: [2],
            contractAddresses: ["0x229310905439d10abd4471775863e78556b35d44"],
          },
        };

        // Define Ask
        const askBundle = {
          offeredEther: ethers.utils.parseEther("0"),
          tokens: {
            amounts: [],
            contractAddresses: [],
          },
          nfts: {
            ids: [1],
            contractAddresses: ["0x06b2a984ce3e1b58fd8b8d41e298b31b57513d88"],
          },
        };

        //Flow for offering
        const erc721 = new ethers.Contract(
          offerBundle.nfts.contractAddresses[0],
          ERC721.abi,
          signer
        );

        //Account 1 allows contract to trade coins and nfts
        const approvalTxn = await erc721.setApprovalForAll(
          contract.address,
          true
        );
        await approvalTxn.wait();

        const offerTxn = await contract.createOffer(
          "0xe898bbd704cce799e9593a9ade2c1ca0351ab660",
          offerBundle,
          askBundle
        );
        await offerTxn.wait();
      }
    };

    //makeOffer();
  }, []);

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

const Offer = ({ sent, offer, refreshData }) => {
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [loadingRescind, setLoadingRescind] = useState(false);

  const rescindOffer = async (offer) => {
    try {
      const { ethereum } = window as any;

      if (ethereum) {
        setLoadingRescind(true);
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          contractAddress,
          barter.abi,
          signer
        );

        const id = offer.id;

        const txn = await contract.recallOffer(id);
        await txn.wait();
      }
    } catch (error) {
      console.error("Error:", error);
    }

    setLoadingRescind(false);
    refreshData();
  };

  const acceptOffer = async (offer) => {
    try {
      const { ethereum } = window as any;

      if (ethereum) {
        setLoadingAccept(true);
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          contractAddress,
          barter.abi,
          signer
        );

        // Get user approval for all assets they might trade
        const nfts = offer.askBundle.nfts;
        for (let i = 0; i < nfts.contractAddresses.length; i++) {
          const address = nfts.contractAddresses[i];

          const erc721 = new ethers.Contract(address, ERC721.abi, signer);
          const approvalTxn = await erc721.setApprovalForAll(
            contract.address,
            true
          );
          await approvalTxn.wait();
        }

        const tokens = offer.askBundle.tokens;
        for (let i = 0; i < tokens.contractAddresses.length; i++) {
          const address = tokens.contractAddresses[i];
          const amount = tokens.amounts[i];

          const erc20 = new ethers.Contract(address, ERC20.abi, signer);
          const approvalTxn = await erc20.approve(contract.address, amount);
          await approvalTxn.wait();
        }

        const id = offer.id;

        const offerTxn = await contract.acceptOffer(id);
        await offerTxn.wait();

        // Flow for accepting
        // const erc721 = new ethers.Contract(
        //   askBundle.nfts.contractAddresses[0],
        //   ERC721.abi,
        //   signer
        // );

        // //Account 1 allows contract to trade coins and nfts
        // const approvalTxn = await erc721.setApprovalForAll(
        //   contract.address,
        //   true
        // );
        // await approvalTxn.wait();

        // const offerTxn = await contract.acceptOffer(0);
        // await offerTxn.wait();
      }
    } catch (error) {
      console.error("Error:", error);
    }

    setLoadingAccept(false);
    refreshData();
  };

  const handleAcceptClick = () => {
    acceptOffer(offer);
  };

  const handleRescindClick = () => {
    rescindOffer(offer);
  };

  const left = sent ? offer.offerBundle : offer.askBundle;
  const right = sent ? offer.askBundle : offer.offerBundle;
  const otherAddress = sent ? offer.target : offer.offerer;

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
      <Grid
        templateColumns="repeat(3, 33.3%)"
        gap={2}
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
              {sent ? "Your offer to" : "Incoming offer from"}
            </Text>{" "}
            <Text
              cursor="pointer"
              color="#3BACE2
									"
              fontSize="2xl"
              fontWeight="800"
              mb="10px"
            >
              {trimAddress(otherAddress)}{" "}
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
            </Text>
            <Box>
              {left.tokens.contractAddresses.map((address, i) => {
                return (
                  <Box key={i}>
                    <Text>{`address: ${address}, amount: ${offer.offerBundle.tokens.amounts[i]}`}</Text>
                  </Box>
                );
              })}
            </Box>
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
            </Text>
            <Box>
              {left.nfts.contractAddresses.map((address, i) => {
                return (
                  <Box key={i}>
                    <Text>{`address: ${address}, id: ${offer.offerBundle.nfts.ids[i]}`}</Text>
                  </Box>
                );
              })}
            </Box>
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
            {loadingAccept || loadingRescind ? (
              <Spinner color="white" />
            ) : sent ? (
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
                  mb={5}
                >
                  Offer pending approval from {trimAddress(otherAddress)}
                </Text>
                <Button width="80%" onClick={handleRescindClick} warning>
                  Rescind
                </Button>
              </>
            ) : (
              <>
                <Box mt="6" mb="6">
                  <img src="/arrows.svg" />
                </Box>
                <Button width="80%" onClick={handleAcceptClick} mb={5}>
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
              {sent ? "Your Request" : "Their Request"}
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
            </Text>
            <Box>
              <Box>
                {right.tokens.contractAddresses.map((address, i) => {
                  return (
                    <Box key={i}>
                      <Text>{`address: ${address}, amount: ${offer.askBundle.tokens.amounts[i]}`}</Text>
                    </Box>
                  );
                })}
              </Box>
            </Box>
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
            </Text>
            <Box>
              {right.nfts.contractAddresses.map((address, i) => {
                return (
                  <Box key={i}>
                    <Text>{`address: ${address}, id: ${offer.askBundle.nfts.ids[i]}`}</Text>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Flex>
      </Grid>
    </Flex>
  );
};
