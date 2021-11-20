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

const contractAddress = "0x57b6492437615F5FaD1B87F349c02fc8A1cFAC2f";

export default function Offers() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { authenticate, isAuthenticated, user } = useMoralis();
  const [offers, setOffers] = useState([]);

  const changeView = () => {
    setSent((val) => !val);
  };

  useEffect(() => {
    const grabData = async () => {
      try {
        const { ethereum } = window as any;

        if (ethereum) {
          setLoading(true);
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

      setLoading(false);
    };

    console.log("In UseEffect!");
    grabData();
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
        {loading ? (
          <Spinner size="xl" color="white" />
        ) : (
          <>
            {offers.map((offer) => (
              <Offer sent={sent} offer={offer} />
            ))}
          </>
        )}
      </Flex>

      <footer></footer>
    </Layout>
  );
}

const Offer = ({ sent, offer }) => {
  const rescindOffer = async (offer) => {
    const { ethereum } = window as any;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, barter.abi, signer);

      const id = offer.id ?? 1;

      const txn = await contract.acceptOffer(id);
      await txn.wait();
    }
  };

  const acceptOffer = async (offer) => {
    try {
      const { ethereum } = window as any;

      if (ethereum) {
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

        const id = offer.id ?? 1;

        const offerTxn = await contract.acceptOffer(id);
        await offerTxn.wait();

        // const offerBundle = {
        //   offeredEther: ethers.utils.parseEther("0"),
        //   tokens: {
        //     amounts: [],
        //     contractAddresses: [],
        //   },
        //   nfts: {
        //     ids: [3],
        //     contractAddresses: ["0xac873d4350174c115a7c703ef0523a63e069b192"],
        //   },
        // };

        // // Define Ask
        // const askBundle = {
        //   offeredEther: ethers.utils.parseEther("0"),
        //   tokens: {
        //     amounts: [],
        //     contractAddresses: [],
        //   },
        //   nfts: {
        //     ids: [3],
        //     contractAddresses: ["0xf2f7af84730d54ebf3bee12b18a5a410ee55ba1c"],
        //   },
        // };

        // Flow for offering
        // const erc721 = new ethers.Contract(
        //   offerBundle.nfts.contractAddresses[0],
        //   ERC721.abi,
        //   signer
        // );

        // //Account 1 allows contract to trade coins and nfts
        // const approvalTxn = await erc721.setApprovalForAll(
        //   contract.address,
        //   true
        // );
        // await approvalTxn.wait();

        // const offerTxn = await contract.createOffer(
        //   "0xe898bbd704cce799e9593a9ade2c1ca0351ab660",
        //   offerBundle,
        //   askBundle
        // );
        // await offerTxn.wait();

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
  };

  const handleAcceptClick = () => {
    acceptOffer(offer);
  };

  const handleRescindClick = () => {
    rescindOffer(offer);
  };

  const left = sent ? offer.offerBundle : offer.askBundle;
  const right = sent ? offer.askBundle : offer.offerBundle;

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
            </Text>
            <Box>
              {left.tokens.contractAddresses.map((address, i) => {
                return (
                  <Box>
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
                  <Box>
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
                  mb={5}
                >
                  Offer pending approval from 0xcfaf2....a101d
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
                    <Box>
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
                  <Box>
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
