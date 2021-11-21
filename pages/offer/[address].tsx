import React, { useState, useEffect } from "react";
import {
  Flex,
  Heading,
  useToast,
  Text,
  Grid,
  Box,
  Spinner,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import { useMoralis, useMoralisWeb3Api } from "react-moralis";
import { BigNumber } from "@ethersproject/bignumber";

import NFTContainer, { nftContainerSizes } from "../../components/NFTContainer";
import TokenContainer from "../../components/TokenContainer";
import Nav from "../../components/Nav";
import Layout from "../../components/Layout";
import Head from "../../components/Head";
import Button from "../../components/Button";

import { trimAddress } from "../../utils/ethereum";

import BarterMarket from "../../artifacts/contracts/BarterMarket.sol/BarterMarket.json";
import ERC721 from "../../artifacts/contracts/MockERC721.sol/MockERC721.json";
import ERC20 from "../../artifacts/contracts/MockERC20.sol/MockERC20.json";

const CONTRACT_ADDRESS = "0x10E62cFbb59e4fE4319c026ec5Ec19de90665a2d";

export default function MakeOffer() {
  const router = useRouter();
  const { address } = router.query;

  const [txnLoading, setTxnLoading] = useState(false);
  const [barterMarket, setBarterMarket] = useState(null);

  const [myNFTs, setMyNFTs] = useState(null);
  const [myTokens, setMyTokens] = useState(null);

  // CounterParty
  const [cpNfts, setCPNFTs] = useState(null);
  const [cpTokens, setCPTokens] = useState(null);

  // Offer & Ask NFTs and Tokens
  const [offerNFTs, setOfferNFTs] = useState([]);
  const [offerTokens, setOfferTokens] = useState([]);
  const [askNFTs, setAskNFTs] = useState([]);
  const [askTokens, setAskTokens] = useState([]);

  const Web3Api = useMoralisWeb3Api();
  const toast = useToast();
  const { web3, enableWeb3, isWeb3Enabled, user } = useMoralis();

  const isSSR = typeof window === undefined;

  // Hooks

  useEffect(() => {
    if (isSSR) {
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      BarterMarket.abi,
      signer
    );

    setBarterMarket(contract);
  }, [isSSR]);

  useEffect(() => {
    if (!isWeb3Enabled) {
      enableWeb3();
    }
  }, [isWeb3Enabled, enableWeb3]);

  async function resolveDomain() {
    if (!isWeb3Enabled) {
      return;
    }
    try {
      if (address.includes(".eth")) {
        const res = await web3.eth.ens.getAddress(address);
        return res.address;
      }
      return address;
    } catch (err) {
      toast({
        title: "An error occured",
        description: err.message,
        status: "error",
      });
      return address;
    }
  }

  useEffect(() => {
    if (!isWeb3Enabled) {
      return;
    }

    if (!user) {
      setMyTokens(null);
      setMyNFTs(null);
      return;
    }

    if (!address) {
      setCPTokens(null);
      setCPNFTs(null);
      return;
    }

    if (!address.includes(".eth") && address.length !== 42) {
      return;
    }

    const myAddress = user?.get("ethAddress");

    async function getNFTs() {
      try {
        const counterPartyAddress = await resolveDomain();

        const counterPartyNFTs = await Web3Api.account.getNFTs({
          address: counterPartyAddress,
          chain: process.env.NEXT_PUBLIC_CHAIN,
        });
        const myNFTs = await Web3Api.account.getNFTs({
          address: myAddress,
          chain: process.env.NEXT_PUBLIC_CHAIN,
        });

        setCPNFTs(counterPartyNFTs.result);
        setMyNFTs(myNFTs.result);
      } catch (err) {
        setCPNFTs(null);
        setMyNFTs(null);
      }
    }

    async function getTokens() {
      try {
        const counterPartyAddress = await resolveDomain();
        const counterPartyTokens = await Web3Api.account.getTokenBalances({
          address: counterPartyAddress,
          chain: process.env.NEXT_PUBLIC_CHAIN,
        });
        const myTokens = await Web3Api.account.getTokenBalances({
          address: myAddress,
          chain: process.env.NEXT_PUBLIC_CHAIN,
        });
        setCPTokens(counterPartyTokens);
        setMyTokens(myTokens);
      } catch (err) {
        setCPTokens(null);
      }
    }

    getNFTs();
    getTokens();
  }, [address, user, isWeb3Enabled]);

  const selectToken = (isOwner, address, amount, symbol) => {
    let setToken = isOwner ? setOfferTokens : setAskTokens;
    let tokens = isOwner ? offerTokens : askTokens;

    if (amount === 0) {
      tokens = tokens.filter((token) => !(address === token.address));
    } else {
      let idx = tokens.findIndex((token) => token.address === address);
      let updatedToken = { address, amount, symbol };

      if (idx === -1) {
        tokens = [...tokens, updatedToken];
      } else {
        tokens = [
          ...tokens.slice(0, idx),
          updatedToken,
          ...tokens.slice(idx + 1),
        ];
      }
    }

    setToken(tokens);
  };

  const toggleSelectNFT = (isOwner, isSelected, tokenId, tokenAddress) => {
    let setNFTs = isOwner ? setOfferNFTs : setAskNFTs;
    let nfts = isOwner ? offerNFTs : askNFTs;

    if (isSelected) {
      nfts = nfts.filter(
        (nft) => !(tokenId === nft.tokenId && tokenAddress === nft.tokenAddress)
      );
    } else {
      nfts = [...nfts, { tokenId, tokenAddress }];
    }

    setNFTs(nfts);
  };

  const createOffer = async () => {
    try {
      setTxnLoading(true);
      // Construct Bundles
      let offerBundle = createBundle(offerNFTs, offerTokens);
      let askBundle = createBundle(askNFTs, askTokens);

      // Request Approval
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      for (let i = 0; i < offerTokens.length; i++) {
        let token = offerTokens[i];
        const erc20 = new ethers.Contract(token.address, ERC20.abi, signer);
        const approvalTxn = await erc20.approve(
          barterMarket.address,
          parseInt(token.amount)
        );
        await approvalTxn.wait();
      }

      for (let i = 0; i < offerNFTs.length; i++) {
        let nft = offerNFTs[i];
        const erc721 = new ethers.Contract(
          nft.tokenAddress,
          ERC721.abi,
          signer
        );

        const approvalTxn = await erc721.setApprovalForAll(
          barterMarket.address,
          true
        );

        await approvalTxn.wait();
      }

      const counterPartyAddress = await resolveDomain();
      const offerTxn = await barterMarket.createOffer(
        counterPartyAddress,
        offerBundle,
        askBundle
      );
      await offerTxn.wait();
      setTxnLoading(false);
    } catch (err) {
      setTxnLoading(false);

      toast({
        title: "An error occured",
        description: err.message,
        status: "error",
      });
    }
  };

  const createBundle = (nfts, tokens) => {
    let bundle = {
      nfts: { ids: [], contractAddresses: [] },
      tokens: { amounts: [], contractAddresses: [] },
      offeredEther: ethers.utils.parseEther("0"),
    };

    nfts.forEach((nft) => {
      bundle.nfts.ids.push(BigNumber.from(nft.tokenId));
      bundle.nfts.contractAddresses.push(nft.tokenAddress);
    });

    tokens.forEach((token) => {
      bundle.tokens.amounts.push(BigNumber.from(parseInt(token.amount)));
      bundle.tokens.contractAddresses.push(token.address);
    });

    return bundle;
  };

  return (
    <Layout>
      <Head title="Barter Web3 - Make Offer" />
      <Nav />
      <Flex
        width="100%"
        p="20"
        flex="1"
        alignItems="space-between"
        flexDirection="row"
      >
        {/* My Offer Column */}
        <Flex flex="2" flexDirection="column">
          <Heading size="lg">Make your offer</Heading>
          <Flex flexDirection="column">
            <TokensGrid selectToken={selectToken} tokens={myTokens} />
            <NFTsGrid
              isOwner={true}
              toggleSelect={toggleSelectNFT}
              selectedNFTs={offerNFTs}
              nfts={myNFTs}
            />
          </Flex>
        </Flex>

        {/* Offer CTA  */}
        <Flex justifyContent="flex-start" flex="1.5" flexDirection="column">
          <Flex flexDirection="column" maxWidth="70%" alignItems="center">
            <Flex flexDirection="column" fontWeight="700" textAlign="center">
              <Text> You're offering</Text>
              {offerTokens.map((token) => (
                <Text>{`${token.amount.toFixed(5)} ${token.symbol}`}</Text>
              ))}
              {offerTokens.length && offerNFTs.length ? "and" : ""}
              {offerNFTs.length === 0 ? null : (
                <Text>
                  {offerNFTs?.length} NFT
                  {offerNFTs?.length === 1 ? "" : "s"}
                </Text>
              )}
            </Flex>
            <Box mt="10" mb="10">
              <img src="/arrows.svg" />
            </Box>
            {txnLoading ? (
              <Spinner />
            ) : (
              <Button onClick={createOffer} width="70%">
                Offer barter
              </Button>
            )}
          </Flex>
        </Flex>
        {/* Counterparty Column */}
        <Flex flex="2" flexDirection="column">
          <Heading size="lg">
            Assets owned by{" "}
            <span style={{ color: "#3bace2" }}>{trimAddress(address)}</span>
          </Heading>
          <Flex flexDirection="column">
            <TokensGrid
              selectToken={selectToken}
              isOwner={false}
              tokens={cpTokens}
            />
            <NFTsGrid
              isOwner={false}
              toggleSelect={toggleSelectNFT}
              selectedNFTs={askNFTs}
              nfts={cpNfts}
            />
          </Flex>
        </Flex>
      </Flex>
    </Layout>
  );
}

const TokensGrid = ({ tokens, isOwner = true, selectToken }) => {
  if (tokens && tokens.length !== 0) {
    return (
      <Flex mt="10" flexDirection="column">
        <Text mb="5" fontSize="xl" fontWeight="600">
          {isOwner ? "Your ERC-20 offer" : "Counterparty ERC-20"}
        </Text>

        <Grid templateColumns={["repeat(1, 1fr)"]} gap={2}>
          {tokens.map((token, idx) => {
            return (
              <TokenContainer
                slider={true}
                key={idx}
                token={token}
                selectToken={(tokenAddress, tokenAmount, tokenSymbol) =>
                  selectToken(isOwner, tokenAddress, tokenAmount, tokenSymbol)
                }
              />
            );
          })}
        </Grid>
      </Flex>
    );
  }
  return null;
};

const NFTsGrid = ({ nfts, isOwner = true, toggleSelect, selectedNFTs }) => {
  if (nfts && nfts.length !== 0) {
    return (
      <Flex mt="10" flexDirection="column">
        <Text mb="5" fontSize="xl" fontWeight="600" mb="10">
          {isOwner ? "Your NFTs offer" : "Counterparty NFTs"}
        </Text>

        <Grid templateColumns={["repeat(2, 1fr)"]} columnGap={2} rowGap={5}>
          {nfts.map((nft, idx) => {
            let isSelected = false;

            selectedNFTs?.forEach((selectedNFT) => {
              if (
                selectedNFT.tokenId === nft["token_id"] &&
                selectedNFT.tokenAddress === nft["token_address"]
              ) {
                isSelected = true;
              }
            });

            return (
              <NFTContainer
                onClick={() =>
                  toggleSelect(
                    isOwner,
                    isSelected,
                    nft["token_id"],
                    nft["token_address"]
                  )
                }
                isSelected={isSelected}
                size={nftContainerSizes.sm}
                key={idx}
                nft={nft}
              />
            );
          })}
        </Grid>
      </Flex>
    );
  }

  return null;
};
