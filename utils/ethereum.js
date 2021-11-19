// Check for MetaMask wallet browser extension
function hasEthereum() {
  return (
    typeof window !== "undefined" && typeof window.ethereum !== "undefined"
  );
}

function trimAddress(address) {
  if (address.includes(".eth")) {
    return address;
  }
  return address.slice(0, 6) + "..." + address.slice(-4);
}

export { hasEthereum, trimAddress };
