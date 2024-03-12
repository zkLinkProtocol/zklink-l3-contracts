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
    // log(`Requesting contract verification...`);
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
    address: "0x87d6ab9fE5Adef46228fB490810f0F5CB16D6d04",
    privateKey: "0x105de4e75fe465d075e1daae5647a02e3aad54b8d23cf1f70ba382b9f9bee839"
  },
  {
    address: "0x78cAD996530109838eb016619f5931a03250489A", 
    privateKey: "0x7becc4a46e0c3b512d380ca73a4c868f790d1055a7698f38fb3ca2b2ac97efbb"
  },
  {
    address: "0xc981b213603171963F81C687B9fC880d33CaeD16",
    privateKey: "0xe0415469c10f3b1142ce0262497fe5c7a0795f0cbfd466a6bfa31968d0f70841"
  },
  {
    address: "0x42F3dc38Da81e984B92A95CBdAAA5fA2bd5cb1Ba", 
    privateKey: "0x4d91647d0a8429ac4433c83254fb9625332693c848e578062fe96362f32bfe91"
  },
  {
    address: "0x64F47EeD3dC749d13e49291d46Ea8378755fB6DF",
    privateKey: "0x4d91647d0a8429ac4433c83254fb9625332693c848e578062fe96362f32bfe91"
  },
  {
    address: "0xe2b8Cb53a43a56d4d2AB6131C81Bd76B86D3AFe5",
    privateKey: "0xb0680d66303a0163a19294f1ef8c95cd69a9d7902a4aca99c05f3e134e68a11a"
  }
]