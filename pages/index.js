import Head from "next/head";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { hasEthereum } from "../utils/ethereum";

export default function Home() {
  const [connectedWalletAddress, setConnectedWalletAddressState] = useState("");

  // If wallet is already connected...
  useEffect(() => {
    if (!hasEthereum()) {
      setConnectedWalletAddressState(`MetaMask unavailable`);
      return;
    }
    async function setConnectedWalletAddress() {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      try {
        const signerAddress = await signer.getAddress();
        setConnectedWalletAddressState(`Connected wallet: ${signerAddress}`);
      } catch {
        setConnectedWalletAddressState("No wallet connected");
        return;
      }
    }
    setConnectedWalletAddress();
  }, []);

  // Request access to MetaMask account
  async function requestAccount() {
    await window.ethereum.request({ method: "eth_requestAccounts" });
  }

  return (
    <div className="max-w-lg mt-36 mx-auto text-center px-4">
      <Head>
        <title>Solidity Next.js Starter</title>
        <meta
          name="description"
          content="Interact with a simple smart contract from the client-side."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="space-y-8">
        {!process.env.NEXT_PUBLIC_GREETER_ADDRESS ? (
          <p className="text-md">
            Please add a value to the <pre>NEXT_PUBLIC_GREETER_ADDRESS</pre>{" "}
            environment variable.
          </p>
        ) : (
          <>
            <h1 className="text-4xl font-semibold mb-8">
              Solidity Next.js Starter
            </h1>
            <div className="space-y-8">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white py-4 px-8 rounded-md w-full"
                onClick={requestAccount}
              >
                connect wallet
              </button>
              <div className="h-4">
                {connectedWalletAddress && (
                  <p className="text-md">{connectedWalletAddress}</p>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="mt-20">
        <a
          href="https://github.com/tomhirst/solidity-nextjs-starter/blob/main/README.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700"
        >
          Read the docs
        </a>
      </footer>
    </div>
  );
}
