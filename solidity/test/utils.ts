import { BigNumber } from "@ethersproject/bignumber";

export enum OfferState {
  SENT = 0,
  INPROGRESS,
  ACCEPTED,
  RECALLED,
}

const weiInEth = BigNumber.from(10).pow(18);

// Work with JSON, pass the smart contract arrays.

export interface CoinBundleJSON {
  amounts: number[];
  contractAddresses: string[];
}

export type CoinBundleArray = [BigNumber[], string[]];

export const coinBundleArrayToJSON = (
  arr: CoinBundleArray
): CoinBundleJSON => ({
  amounts: arr[0].map((n) => n.toNumber()),
  contractAddresses: arr[1],
});

export const coinBundleJSONToArray = (j: CoinBundleJSON): CoinBundleArray => [
  j.amounts.map((n) => BigNumber.from(n)),
  j.contractAddresses,
];

export interface NFTBundleJSON {
  ids: number[];
  contractAddresses: string[];
}

export type NFTBundleArray = [BigNumber[], string[]];

export const nftBundleArrayToJSON = (arr: NFTBundleArray): NFTBundleJSON => ({
  ids: arr[0].map((n) => n.toNumber()),
  contractAddresses: arr[1],
});

export const nftBundleJSONToArray = (j: NFTBundleJSON): NFTBundleArray => [
  j.ids.map((n) => BigNumber.from(n)),
  j.contractAddresses,
];

export interface BundleJSON {
  offeredEther: number;
  tokens: CoinBundleJSON;
  nfts: NFTBundleJSON;
}

export type BundleArray = [BigNumber, CoinBundleArray, NFTBundleArray];

export const bundleArrayToJSON = (arr: BundleArray): BundleJSON => ({
  offeredEther: arr[0].div(weiInEth).toNumber(),
  tokens: coinBundleArrayToJSON(arr[1]),
  nfts: nftBundleArrayToJSON(arr[2]),
});

export const bundleJSONToArray = (j: BundleJSON): BundleArray => [
  BigNumber.from(j.offeredEther).mul(weiInEth),
  coinBundleJSONToArray(j.tokens),
  nftBundleJSONToArray(j.nfts),
];

export interface TradeOfferJSON {
  offerer: string;
  target: string;
  offerBundle: BundleJSON;
  askBundle: BundleJSON;
  state: number;
}

export type TradeOfferArray = [
  string,
  string,
  BundleArray,
  BundleArray,
  number
];

export const TradeOfferJSONToArray = (j: TradeOfferJSON): TradeOfferArray => [
  j.offerer,
  j.target,
  bundleJSONToArray(j.offerBundle),
  bundleJSONToArray(j.askBundle),
  j.state,
];

export const TradeOfferArrayToJSON = (
  arr: TradeOfferArray
): TradeOfferJSON => ({
  offerer: arr[0],
  target: arr[1],
  offerBundle: bundleArrayToJSON(arr[2]),
  askBundle: bundleArrayToJSON(arr[3]),
  state: arr[4],
});
