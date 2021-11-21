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
import { ethers } from "ethers";
import { trimAddress } from "../utils/ethereum";
import { useMoralis, useMoralisWeb3Api } from "react-moralis";
import { getNFTData } from "../utils/data";
import TokenContainer from "../components/TokenContainer";

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
            amounts: [100],
            contractAddresses: ["0xc7ad46e0b8a400bb3c915120d284aafba8fc4735"],
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
        let approvalTxn = await erc721.setApprovalForAll(
          contract.address,
          true
        );
        await approvalTxn.wait();

        const erc20 = new ethers.Contract(
          offerBundle.tokens.contractAddresses[0],
          ERC20.abi,
          signer
        );
        approvalTxn = await erc20.approve(contractAddress, 100);
        await approvalTxn.wait();

        const offerTxn = await contract.createOffer(
          "0xE898BBd704CCE799e9593a9ADe2c1cA0351Ab660",
          offerBundle,
          askBundle
        );
        await offerTxn.wait();
      }
    };

    makeOffer();
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
  const [loadingMetaData, setLoadingMetaData] = useState(false);
  const [offerNFTs, setOfferNFTs] = useState([]);
  const [askNFTs, setAskNFTs] = useState([]);
  const [offerTokens, setOfferTokens] = useState([]);
  const [askTokens, setAskTokens] = useState([]);
  const Web3Api = useMoralisWeb3Api();

  const grabNFTMetaData = async (offer): Promise<[any[], any[]]> => {
    const data = await getNFTData(
      [
        ...offer.offerBundle.nfts.contractAddresses,
        ...offer.askBundle.nfts.contractAddresses,
      ],
      [...offer.offerBundle.nfts.ids, ...offer.askBundle.nfts.ids].map((n) =>
        n.toNumber()
      )
    );

    const offerNFTs = data.filter((nft) => {
      for (let i = 0; i < offer.offerBundle.nfts.ids.length; i++) {
        const id = offer.offerBundle.nfts.ids[i].toNumber();
        const address = offer.offerBundle.nfts.contractAddresses[i];

        if (
          nft.asset_contract.address.toUpperCase() === address.toUpperCase() &&
          nft.token_id == id.toString()
        ) {
          return true;
        }
      }

      return false;
    });

    const askNFTs = data.filter((nft) => {
      for (let i = 0; i < offer.askBundle.nfts.ids.length; i++) {
        const id = offer.askBundle.nfts.ids[i].toNumber();
        const address = offer.askBundle.nfts.contractAddresses[i];

        if (
          nft.asset_contract.address.toUpperCase() === address.toUpperCase() &&
          nft.token_id == id.toString()
        ) {
          return true;
        }
      }

      return false;
    });

    return [askNFTs, offerNFTs];
  };

  const grabTokenMetaData = async (offer): Promise<[any[], any[]]> => {
    const offerAddresses = offer.offerBundle.tokens.contractAddresses;
    let offerTokens = [];

    if (offerAddresses.length) {
      offerTokens = await Web3Api.token.getTokenMetadata({
        chain: "rinkeby",
        addresses: offerAddresses,
      });
    }

    const askAddresses = offer.askBundle.tokens.contractAddresses;
    let askTokens = [];

    if (askAddresses.length) {
      askTokens = await Web3Api.token.getTokenMetadata({
        chain: "rinkeby",
        addresses: askAddresses,
      });
    }

    // To get tokens to display in token container, lol this is hacky
    // to-do huge token balances that will overflow js numbers
    offerTokens = offerTokens.map((token, i) => {
      console.log(offer.offerBundle.tokens.amounts[i].toNumber());

      return {
        ...token,
        decimals: "0",
        balance: offer.offerBundle.tokens.amounts[i].toNumber().toString(),
      };
    });

    askTokens = askTokens.map((token, i) => {
      return {
        ...token,
        decimals: "0",
        balance: offer.askBundle.tokens.amounts[i].toNumber().toString(),
      };
    });

    return [askTokens, offerTokens];
  };

  useEffect(() => {
    const getData = async () => {
      try {
        setLoadingMetaData(true);

        const [askNFTs, offerNFTs] = await grabNFTMetaData(offer);
        const [askTokens, offerTokens] = await grabTokenMetaData(offer);

        setAskNFTs(askNFTs);
        setOfferNFTs(offerNFTs);
        setOfferTokens(offerTokens);
        setAskTokens(askTokens);
        setLoadingMetaData(false);
      } catch (error) {
        // handle later
        console.log(error);
      }
    };

    getData();
  }, [offer]);

  const leftNFTs = offerNFTs;
  const rightNFTs = askNFTs;
  const leftTokens = offerTokens;
  const rightTokens = askTokens;
  const otherAddress = sent ? offer.target : offer.offerer;

  console.log(otherAddress);

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
          <Box minHeight="72px">
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
              color="#3BACE2"
              fontSize="2xl"
              fontWeight="800"
              mb="10px"
            >
              {trimAddress(otherAddress)}{" "}
            </Text>
          </Box>
          {leftTokens.length > 0 && (
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
                {offerTokens.map((token, i) => {
                  return <TokenContainer token={token} key={i} />;
                })}
              </Box>
            </Box>
          )}
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
              {loadingMetaData ? (
                <Spinner color="white" />
              ) : (
                offerNFTs.map((nft, i) => {
                  return (
                    <NFTContainer
                      imgUrl={nft.image_url}
                      name={nft.name}
                      key={nft.name + i}
                    />
                  );
                })
              )}
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
          <Box minHeight="72px">
            <Text
              cursor="pointer"
              color="white"
              fontSize="2xl"
              fontWeight="800"
            >
              {sent ? "Your Request" : "Their Request"}
            </Text>{" "}
          </Box>
          {askTokens.length > 0 && (
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
                {askTokens.map((token, i) => {
                  return <TokenContainer token={token} key={i} />;
                })}
              </Box>
            </Box>
          )}
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
              {loadingMetaData ? (
                <Spinner color="white" />
              ) : (
                askNFTs.map((nft, i) => {
                  return (
                    <NFTContainer
                      imgUrl={nft.image_url}
                      name={nft.name}
                      key={nft.name + i}
                    />
                  );
                })
              )}
            </Box>
          </Box>
        </Flex>
      </Grid>
    </Flex>
  );
};

const NFTContainer = ({ imgUrl, name }) => {
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
        backgroundImage={imgUrl}
      />
      <Flex mt="5" width="80%">
        <Flex justifyContent="center" width="100%" height="100%" p="2">
          <Text textAlign="center" fontWeight="700">
            {name}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};
