import * as fs from 'fs';
import { verifyContractCode, createOrGetDeployLog, ChainContractDeployer, getDeployTx } from './utils';
import {
  DEPLOY_LOG_DEPLOYER,
  DEPLOY_LOG_DEPLOY_TX_HASH,
  DEPLOY_LOG_DEPLOY_BLOCK_NUMBER,
  DEPLOY_MULTICALL_LOG_PREFIX,
  DEPLOY_LOG_MULTICALL,
  DEPLOY_LOG_MULTICALL_VERIFIED,
} from './deploy_log_name';
import { task, types } from 'hardhat/config';

function getContractName() {
  return 'Multicall3';
}

task('deployMulticall3', 'Deploy Multicall3')
  .addParam('skipVerify', 'Skip verify', false, types.boolean, true)
  .setAction(async (taskArgs, hardhat) => {
    let skipVerify = taskArgs.skipVerify;
    console.log('skip verify contracts?', skipVerify);

    const contractDeployer = new ChainContractDeployer(hardhat);
    await contractDeployer.init();
    const deployerWallet = contractDeployer.deployerWallet;

    const { deployLogPath, deployLog } = createOrGetDeployLog(DEPLOY_MULTICALL_LOG_PREFIX, hardhat.network.name);
    const dLog = deployLog as any;
    dLog[DEPLOY_LOG_DEPLOYER] = await deployerWallet?.getAddress();
    fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));

    // deploy merge token
    let multicall3Addr;
    if (!(DEPLOY_LOG_MULTICALL in dLog)) {
      console.log('deploy multicall3...');
      const contractName = getContractName();
      const contract = await contractDeployer.deployContract(contractName, []);
      const transaction = await getDeployTx(contract);
      multicall3Addr = await contract.getAddress();
      dLog[DEPLOY_LOG_MULTICALL] = multicall3Addr;
      dLog[DEPLOY_LOG_DEPLOY_TX_HASH] = transaction?.hash;
      dLog[DEPLOY_LOG_DEPLOY_BLOCK_NUMBER] = transaction?.blockNumber;
      fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
    } else {
      multicall3Addr = dLog[DEPLOY_LOG_MULTICALL];
    }
    console.log('multicall3 token', multicall3Addr);

    if (!skipVerify) {
      await verifyContractCode(hardhat, multicall3Addr, []);
      dLog[DEPLOY_LOG_MULTICALL_VERIFIED] = true;
      fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
    }
  });
