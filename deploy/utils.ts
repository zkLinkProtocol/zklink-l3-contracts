import { Provider, Wallet } from "zksync-ethers";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import dotenv from "dotenv";
import { ethers } from "ethers";

import "@matterlabs/hardhat-zksync-node/dist/type-extensions";
import "@matterlabs/hardhat-zksync-verify/dist/src/type-extensions";

// Load env file
dotenv.config();

export const getProvider = () => {
  const rpcUrl = 'http://127.0.0.1:8011';
  // const rpcUrl = hre.network.config.url;
  // console.log(rpcUrl,"url")
  if (!rpcUrl) throw `⛔️ RPC URL wasn't found in "${hre.network.name}"! Please add a "url" field to the network config in hardhat.config.ts`;
  
  // Initialize zkSync Provider
  const provider = new Provider(rpcUrl);

  return provider;
}

export const getWallet = (privateKey?: string) => {
  if (!privateKey) {
    // Get wallet private key from .env file
    if (!process.env.WALLET_PRIVATE_KEY) throw "⛔️ Wallet private key wasn't found in .env file!";
  }

  const provider = getProvider();
  
  // Initialize zkSync Wallet
  const wallet = new Wallet(privateKey ?? process.env.WALLET_PRIVATE_KEY!, provider);

  return wallet;
}

export const verifyEnoughBalance = async (wallet: Wallet, amount: bigint) => {
  // Check if the wallet has enough balance
  const balance = await wallet.getBalance();
  if (balance < amount) throw `⛔️ Wallet balance is too low! Required ${ethers.formatEther(amount)} ETH, but current ${wallet.address} balance is ${ethers.formatEther(balance)} ETH`;
}

/**
 * @param {string} data.contract The contract's path and name. E.g., "contracts/Greeter.sol:Greeter"
 */
export const verifyContract = async (data: {
  address: string,
  contract: string,
  constructorArguments: string,
  bytecode: string
}) => {
  const verificationRequestId: number = await hre.run("verify:verify", {
    ...data,
    noCompile: true,
  });
  return verificationRequestId;
}

type DeployContractOptions = {
  /**
   * If true, the deployment process will not print any logs
   */
  silent?: boolean
  /**
   * If true, the contract will not be verified on Block Explorer
   */
  noVerify?: boolean
  /**
   * If specified, the contract will be deployed using this wallet
   */ 
  wallet?: Wallet
}
export const deployContract = async (contractArtifactName: string, constructorArguments?: any[], options?: DeployContractOptions) => {
  const log = (message: string) => {
    if (!options?.silent) console.log(message);
  }

  // log(`\nStarting deployment process of "${contractArtifactName}"...`);
  
  const wallet = options?.wallet ?? getWallet();
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact(contractArtifactName).catch((error) => {
    if (error?.message?.includes(`Artifact for contract "${contractArtifactName}" not found.`)) {
      console.error(error.message);
      throw `⛔️ Please make sure you have compiled your contracts or specified the correct contract name!`;
    } else {
      throw error;
    }
  });

  // Estimate contract deployment fee
  const deploymentFee = await deployer.estimateDeployFee(artifact, constructorArguments || []);
  // log(`Estimated deployment cost: ${ethers.formatEther(deploymentFee)} ETH`);

  // Check if the wallet has enough balance
  await verifyEnoughBalance(wallet, deploymentFee);

  // Deploy the contract to zkSync
  const contract = await deployer.deploy(artifact, constructorArguments);
  const address = await contract.getAddress();
  const constructorArgs = contract.interface.encodeDeploy(constructorArguments);
  const fullContractSource = `${artifact.sourceName}:${artifact.contractName}`;

  // Display contract deployment info
  // log(`\n"${artifact.contractName}" was successfully deployed:`);
  // log(` - Contract address: ${address}`);
  // log(` - Contract source: ${fullContractSource}`);
  // log(` - Encoded constructor arguments: ${constructorArgs}\n`);

  if (!options?.noVerify && hre.network.config.verifyURL) {
    log(`Requesting contract verification...`);
    await verifyContract({
      address,
      contract: fullContractSource,
      constructorArguments: constructorArgs,
      bytecode: artifact.bytecode,
    });
  }

  return contract;
}

/**
 * Rich wallets can be used for testing purposes.
 * Available on zkSync In-memory node and Dockerized node.
 */
export const LOCAL_RICH_WALLETS = [
  {
    address: "0xBC989fDe9e54cAd2aB4392Af6dF60f04873A033A",
    privateKey: "0x3d3cbc973389cb26f657686445bcc75662b415b656078503592ac8c1abb8810e"
  },
  {
    address: "0x55bE1B079b53962746B2e86d12f158a41DF294A6",
    privateKey: "0x509ca2e9e6acf0ba086477910950125e698d4ea70fa6f63e000c5a22bda9361c"
  },
  {
    address: "0xCE9e6063674DC585F6F3c7eaBe82B9936143Ba6C",
    privateKey: "0x71781d3a358e7a65150e894264ccc594993fbc0ea12d69508a340bc1d4f5bfbc"
  },
  {
    address: "0xd986b0cB0D1Ad4CCCF0C4947554003fC0Be548E9",
    privateKey: "0x379d31d4a7031ead87397f332aab69ef5cd843ba3898249ca1046633c0c7eefe"
  },
  {
    address: "0x8002cD98Cfb563492A6fB3E7C8243b7B9Ad4cc92",
    privateKey: "0xf12e28c0eb1ef4ff90478f6805b68d63737b7f33abfa091601140805da450d93"
  },
  {
    address: "0x4F9133D1d3F50011A6859807C837bdCB31Aaab13",
    privateKey: "0xe667e57a9b8aaa6709e51ff7d093f1c5b73b63f9987e4ab4aa9a5c699e024ee8"
  },
  {
    address: "0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA",
    privateKey: "0x28a574ab2de8a00364d5dd4b07c4f2f574ef7fcc2a86a197f65abaec836d1959"
  },
  {
    address: "0xedB6F5B4aab3dD95C7806Af42881FF12BE7e9daa",
    privateKey: "0x74d8b3a188f7260f67698eb44da07397a298df5427df681ef68c45b34b61f998"
  },
  {
    address: "0xe706e60ab5Dc512C36A4646D719b889F398cbBcB",
    privateKey: "0xbe79721778b48bcc679b78edac0ce48306a8578186ffcb9f2ee455ae6efeace1"
  },
  {
    address: "0xE90E12261CCb0F3F7976Ae611A29e84a6A85f424",
    privateKey: "0x3eb15da85647edd9a1159a4a13b9e7c56877c4eb33f614546d4db06a51868b1c"
  }
]