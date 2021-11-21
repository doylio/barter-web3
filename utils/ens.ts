import { ethers } from "ethers";

const provider = ethers.providers.getDefaultProvider("mainnet");

// To avoid getting rate limited, cache the results
let ensCache: Record<string, string> = {};

export const ensToAddress = async (ensName: string): Promise<string> => {
  if (ensCache[ensName]) {
    return ensCache[ensName];
  } else {
    const address = await provider.resolveName(ensName);
    ensCache[ensName] = address;
    return address;
  }
};

export const addressToEns = async (address: string): Promise<string | null> => {
  const cachedRecord = Object.entries(ensCache).find(
    ([name, addr]) => addr === address
  );
  if (cachedRecord) {
    return cachedRecord[0];
  } else {
    const ensName = await provider.lookupAddress(address);
    if (ensName) {
      ensCache[ensName] = address;
      return ensName;
    } else {
      return null;
    }
  }
};
