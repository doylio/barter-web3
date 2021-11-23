## The Project

This project is an application to allow 2 users to barter with each other for arbitrary assets.  The inspiration for this came out of MMO RPG games, where players can trade with each other in game, by proposing that they exchange some group of items for some other group.  In our application, a user can type in an address or ENS name, and they will be brought to a screen to propose a trade.  They will select any group of NFTs and ERC20s from their wallet, and any group of NFTs and ERC20s from the other users wallet.  They can then propose a trade, where they will be prompted to approve the barter contract to transfer those assets, before creating the trade in the smart contract.

<img width="717" alt="Screen Shot 2021-11-21 at 12 28 33 PM" src="https://user-images.githubusercontent.com/17352012/143093211-739cd21c-46eb-43fb-a985-8d0559da2065.png">


## Tech Details

We built this project with a smart contract backend, written in solidity.  It is responsible to keeping track of offers made between users, and for handling the transfer of assets between users if the offer is accepted.  We created the smart contract with Hardhat, and built an extensive test suite.  

For the frontend, we used NextJS and Ethers to create the client app.  We originally wanted to use the Covalent API to fetch the list of ERC20 and ERC721s from an account, but we kept getting timeout errors so eventually switched to Moralis.  The app needed to use the server to fetch a list of all NFTs and ERC20 in the 2 users accounts so the trade could be constructed.  This also turned out to be problematic, because Moralis does not catalogue on all assets on Rinkeby, the testate we deployed to.  So at present, the fetching of assets is broken

We also needed the frontend to make sure all transfers were approved before the trade was created or accepted.  This meant a lot of complicated ethers code to ensure no gas was wasted in a trade that was not ready.

For resolving ENS names, we used the Ethers ens functions.

We deployed our client on IPFS.  To do this, we originally used a local IPFS node, but eventually migrated to fleek.co for convenience.  This was much more difficult than anticipated because many of the abilities and properties of a web server are not available on IPFS.  For example, we originally had multiple pages with dynamic routing.  `/offer/brantly.eth` would resolve to the create offer page with the brantley.eth address as the target.  However on IPFS, this could not be achieved, as everything resolved to a simple file system.  

To get around this, we reorganized the client to render in a single page.  We feel that it would be possible to have different routes for different pages, but with time constraints, we decided not to attempt that for this project.

## Getting Started

### Environment Setup

Duplicate `.env.example` to `.env` and fill out the `HARDHAT_CHAIN_ID` environment variable. The port from the example file, if it's free, will be fine in most cases.

Run `npm install`.

### Running The Smart Contract Locally

Compile the ABI for the smart contract using `npx hardhat compile`.

If you're successful, you'll recieve a confirmation message of:

```
Compilation finished successfully
```

And, a `src/artifacts` folder will be created in your project.

Deploy the smart contract to the local blockchain for testing with `npx hardhat node`.

If you're successful, you'll be presented with a number of account details in the CLI. Here's an example:

```
Account #0: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Then in a new terminal window, `npx hardhat run scripts/deploy.ts --network localhost`.

If you're successful, you'll get something like the following CLI output:

```
Greeter deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

### Adding A Local Account To MetaMask

Add a new network [learn how here](https://ethereum.stackexchange.com/questions/78724/metamask-not-showing-localhost-7545)

chainId: 31337

Next, import one of the accounts by adding its Private Key (for example, `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` to MetaMask.

If you're successful, you should see the a balance resembling something like `10000 ETH` in the wallet.

### Connecting The Front-End

In `.env` set the `NEXT_PUBLIC_GREETER_ADDRESS` environment variable to the address your smart contract was deployed to. For example, `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`.

In a new terminal window, load the front-end with `npm run dev`. If you want to use an alternate port from `3000`, use `npm run dev -- --port=1234`, or whatever port number you prefer.

## Editing The Front-End

To modify the front page of your application, edit `pages/index.js`.


To lint your front-end code, use `npm run lint`.

## Testing

To test your smart contracts, run `npm run test-contracts`.
