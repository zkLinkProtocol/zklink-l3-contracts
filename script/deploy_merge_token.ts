import * as fs from 'fs';
import {
  verifyContractCode,
  createOrGetDeployLog,
  ChainContractDeployer,
  getDeployTx,
  readDeployContract,
} from './utils';
import {
  DEPLOY_LOG_DEPLOYER,
  DEPLOY_PORTAL_LOG_PREFIX,
  DEPLOY_LOG_PORTAL_PROXY,
  DEPLOY_MERGETOKEN_LOG_PREFIX,
  DEPLOY_LOG_MERGETOKEN,
  DEPLOY_LOG_MERGETOKEN_NAME,
  DEPLOY_LOG_MERGETOKEN_SYMBOL,
  DEPLOY_LOG_MERGETOKEN_DECIMALS,
  DEPLOY_LOG_MERGETOKEN_VERIFIED,
  DEPLOY_LOG_DEPLOY_TX_HASH,
  DEPLOY_LOG_DEPLOY_BLOCK_NUMBER,
} from './deploy_log_name';
import { task, types } from 'hardhat/config';

function getContractName() {
  return 'ERC20MergeToken';
}

task('deployMergeToken', 'Deploy MergeToken')
  .addParam('name', 'The merge token name', undefined, types.string, false)
  .addParam('symbol', 'The merge token symbol', undefined, types.string, false)
  .addParam('decimals', 'The merge token decimals', undefined, types.int, false)
  .addParam('portal', 'The portal address (default get from portal deploy log)', undefined, types.string, true)
  .addParam('skipVerify', 'Skip verify', false, types.boolean, true)
  .setAction(async (taskArgs, hardhat) => {
    let name = taskArgs.name;
    let symbol = taskArgs.symbol;
    let decimals = taskArgs.decimals;
    console.log('name:', name);
    console.log('symbol:', symbol);
    console.log('decimals:', decimals);

    let portal = taskArgs.portal;
    if (portal === undefined) {
      portal = readDeployContract(DEPLOY_PORTAL_LOG_PREFIX, DEPLOY_LOG_PORTAL_PROXY, hardhat.network.name);
    }
    let skipVerify = taskArgs.skipVerify;
    console.log('skip verify contracts?', skipVerify);
    console.log('portal address:', portal);

    const contractDeployer = new ChainContractDeployer(hardhat);
    await contractDeployer.init();
    const deployerWallet = contractDeployer.deployerWallet;

    const { deployLogPath, deployLog } = createOrGetDeployLog(
      DEPLOY_MERGETOKEN_LOG_PREFIX + '_' + symbol,
      hardhat.network.name,
    );
    const dLog = deployLog as any;
    dLog[DEPLOY_LOG_DEPLOYER] = await deployerWallet?.getAddress();
    fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));

    // deploy merge token
    let mergeTokenAddr;
    if (!(DEPLOY_LOG_MERGETOKEN in dLog)) {
      console.log('deploy merge token...');
      const contractName = getContractName();
      const contract = await contractDeployer.deployContract(contractName, [portal, name, symbol, decimals]);
      const transaction = await getDeployTx(contract);
      mergeTokenAddr = await contract.getAddress();
      dLog[DEPLOY_LOG_MERGETOKEN] = mergeTokenAddr;
      dLog[DEPLOY_LOG_MERGETOKEN_NAME] = name;
      dLog[DEPLOY_LOG_MERGETOKEN_SYMBOL] = symbol;
      dLog[DEPLOY_LOG_MERGETOKEN_DECIMALS] = decimals;
      dLog[DEPLOY_LOG_DEPLOY_TX_HASH] = transaction?.hash;
      dLog[DEPLOY_LOG_DEPLOY_BLOCK_NUMBER] = transaction?.blockNumber;
      fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
    } else {
      mergeTokenAddr = dLog[DEPLOY_LOG_MERGETOKEN];
    }
    console.log('merge token', mergeTokenAddr);

    if (!skipVerify) {
      await verifyContractCode(hardhat, mergeTokenAddr, [portal, name, symbol, decimals]);
      dLog[DEPLOY_LOG_MERGETOKEN_VERIFIED] = true;
      fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
    }
  });
