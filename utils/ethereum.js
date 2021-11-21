// Check for MetaMask wallet browser extension
export function hasEthereum() {
  return (
    typeof window !== "undefined" && typeof window.ethereum !== "undefined"
  );
}

export function trimAddress(address) {
  if (!address) {
    return;
  }
  if (address.includes(".")) {
    return address;
  }
  return address.slice(0, 6) + "..." + address.slice(-4);
}
