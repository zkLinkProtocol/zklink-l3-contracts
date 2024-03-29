import { Contract, Interface, JsonRpcProvider, Wallet} from 'ethers';
import * as fs from 'fs';

const MAINNET_RPC_URL = 'https://rpc.sepolia.org';
const privateKey = '';
if (!MAINNET_RPC_URL) throw new Error('Please set the MAINNET_RPC_URL environment variable.');

const provider = new JsonRpcProvider(MAINNET_RPC_URL);
const wallet = new Wallet(privateKey);
const signer = wallet.connect(provider);
console.log('wallet', wallet.address);

// multicall traget address
var MULTICALL_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

const MULTICALL_ABI_ETHERS = fs.readFileSync('./abi/Multicall3.json', 'utf8');
// Get Multicall contract instance.
const multicall = new Contract(MULTICALL_ADDRESS, MULTICALL_ABI_ETHERS, signer);

async function example1() {
  // Define some users.
  const users = [
    '0x292485B7B9F90bfD5888951285C5B3d7a812c453',
    '0x262A7b68a35e70cD54f6Ea85e97560310a764B4E',
    '0xE959A2c1c3F108697c244b98C71803b6DcD77764',
  ];

  // Setup the contract addresses and interface methods that we'll need.
  const ensRegistryAddr = '0xe8188160f0b8E4A2940A6B9779ed0FE9A2506dF7';
  const ensBalanceOfInterface = new Interface(['function balanceOf(address) view returns (uint256)']);

  const balanceOfCalls = users.map((addr) => ({
    target: ensRegistryAddr,
    allowFailure: false, // We allow failure for all calls.
    callData: ensBalanceOfInterface.encodeFunctionData('balanceOf', [addr]),
  }));

  // Execute those calls.
  type Aggregate3Response = { success: boolean; returnData: string };
  const balanceOfResults: Aggregate3Response[] = await multicall.aggregate3.staticCall(
    balanceOfCalls
  );

  console.log('balanceOfResults', balanceOfResults);

  // Decode the responses.
  balanceOfResults.map(({ success, returnData }, i) => {
    if (!success) throw new Error(`Failed to get balance for ${users[i]}`);
    const result = ensBalanceOfInterface.decodeFunctionResult('balanceOf', returnData)[0];
    console.log(`the banlance of ${users[i]}`,result)
  });
}

example1().catch(console.error);