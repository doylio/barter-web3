import { BigNumber } from "@ethersproject/bignumber";

export enum OfferState {
  SENT = 0,
  INPROGRESS,
  ACCEPTED,
  RECALLED,
}

export const weiInEth = BigNumber.from(10).pow(18);

// Work with JSON, smart contract outputs arrays

export interface CoinBundleJSON {
  amounts: BigNumber[];
  contractAddresses: string[];
}

export type CoinBundleArray = [BigNumber[], string[]];

export const coinBundleArrayToJSON = (
  arr: CoinBundleArray
): CoinBundleJSON => ({
  amounts: arr[0],
  contractAddresses: arr[1],
});

export const coinBundleJSONToArray = (j: CoinBundleJSON): CoinBundleArray => [
  j.amounts.map((n) => BigNumber.from(n)),
  j.contractAddresses,
];

export interface NFTBundleJSON {
  ids: BigNumber[];
  contractAddresses: string[];
}

export type NFTBundleArray = [BigNumber[], string[]];

export const nftBundleArrayToJSON = (arr: NFTBundleArray): NFTBundleJSON => ({
  ids: arr[0],
  contractAddresses: arr[1],
});

export const nftBundleJSONToArray = (j: NFTBundleJSON): NFTBundleArray => [
  j.ids,
  j.contractAddresses,
];

export interface BundleJSON {
  offeredEther: BigNumber;
  tokens: CoinBundleJSON;
  nfts: NFTBundleJSON;
}

export type BundleArray = [BigNumber, CoinBundleArray, NFTBundleArray];

export const bundleArrayToJSON = (arr: BundleArray): BundleJSON => ({
  offeredEther: arr[0],
  tokens: coinBundleArrayToJSON(arr[1]),
  nfts: nftBundleArrayToJSON(arr[2]),
});

export const bundleJSONToArray = (j: BundleJSON): BundleArray => [
  BigNumber.from(j.offeredEther).mul(weiInEth),
  coinBundleJSONToArray(j.tokens),
  nftBundleJSONToArray(j.nfts),
];

export interface TradeOfferJSON {
  id: BigNumber;
  offerer: string;
  target: string;
  offerBundle: BundleJSON;
  askBundle: BundleJSON;
  state: number;
}

export type TradeOfferArray = [
  BigNumber,
  string,
  string,
  BundleArray,
  BundleArray,
  number
];

export const TradeOfferJSONToArray = (j: TradeOfferJSON): TradeOfferArray => [
  j.id,
  j.offerer,
  j.target,
  bundleJSONToArray(j.offerBundle),
  bundleJSONToArray(j.askBundle),
  j.state,
];

export const TradeOfferArrayToJSON = (
  arr: TradeOfferArray
): TradeOfferJSON => ({
  id: BigNumber.from(arr[0]),
  offerer: arr[1],
  target: arr[2],
  offerBundle: bundleArrayToJSON(arr[3]),
  askBundle: bundleArrayToJSON(arr[4]),
  state: arr[5],
});
