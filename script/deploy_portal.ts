import * as fs from 'fs';
import { getImplementationAddress } from '@openzeppelin/upgrades-core';
import {
  verifyContractCode,
  createOrGetDeployLog,
  ChainContractDeployer,
  getDeployTx,
  readDeployContract,
} from './utils';
import {
  DEPLOY_PORTAL_LOG_PREFIX,
  DEPLOY_LOG_DEPLOYER,
  DEPLOY_LOG_PORTAL_COUNCIL,
  DEPLOY_LOG_PORTAL_TARGET,
  DEPLOY_LOG_PORTAL_TARGET_VERIFIED,
  DEPLOY_LOG_PORTAL_PROXY,
  DEPLOY_LOG_PORTAL_PROXY_VERIFIED,
  DEPLOY_LOG_DEPLOY_TX_HASH,
  DEPLOY_LOG_DEPLOY_BLOCK_NUMBER,
} from './deploy_log_name';
import { task, types } from 'hardhat/config';

function getPortalContractName() {
  return 'MergeTokenPortal';
}

function getMergeTokenContractName() {
  return 'ERC20MergeToken';
}

task('deployPortal', 'Deploy portal')
  .addParam('securityCouncil', 'The Security Council address', undefined, types.string, false)
  .addParam('skipVerify', 'Skip verify', false, types.boolean, true)
  .setAction(async (taskArgs, hardhat) => {
    let securityCouncilAddress = taskArgs.securityCouncil;
    let skipVerify = taskArgs.skipVerify;
    console.log('security council address', securityCouncilAddress);
    console.log('skip verify contracts?', skipVerify);

    const contractDeployer = new ChainContractDeployer(hardhat);
    await contractDeployer.init();
    const deployerWallet = contractDeployer.deployerWallet;

    const { deployLogPath, deployLog } = createOrGetDeployLog(DEPLOY_PORTAL_LOG_PREFIX, hardhat.network.name);
    const dLog = deployLog as any;
    dLog[DEPLOY_LOG_DEPLOYER] = await deployerWallet?.getAddress();
    dLog[DEPLOY_LOG_PORTAL_COUNCIL] = securityCouncilAddress;
    fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));

    // deploy portal
    let portalAddr;
    if (!(DEPLOY_LOG_PORTAL_PROXY in dLog)) {
      console.log('deploy portal...');
      const contractName = getPortalContractName();
      const contract = await contractDeployer.deployProxy(contractName, [securityCouncilAddress], {
        unsafeAllow: ['constructor'],
      });
      const transaction = await getDeployTx(contract);
      portalAddr = await contract.getAddress();
      dLog[DEPLOY_LOG_PORTAL_PROXY] = portalAddr;
      dLog[DEPLOY_LOG_DEPLOY_TX_HASH] = transaction?.hash;
      dLog[DEPLOY_LOG_DEPLOY_BLOCK_NUMBER] = transaction?.blockNumber;
      fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
    } else {
      portalAddr = dLog[DEPLOY_LOG_PORTAL_PROXY];
    }
    console.log('portal', portalAddr);

    let portalTargetAddr;
    if (!(DEPLOY_LOG_PORTAL_TARGET in dLog)) {
      console.log('get portal target...');
      portalTargetAddr = await getImplementationAddress(hardhat.ethers.provider, portalAddr);
      dLog[DEPLOY_LOG_PORTAL_TARGET] = portalTargetAddr;
      fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
    } else {
      portalTargetAddr = dLog[DEPLOY_LOG_PORTAL_TARGET];
    }
    console.log('portal target', portalTargetAddr);

    // verify target contract
    if (!(DEPLOY_LOG_PORTAL_TARGET_VERIFIED in dLog) && !skipVerify) {
      await verifyContractCode(hardhat, portalTargetAddr, []);
      dLog[DEPLOY_LOG_PORTAL_TARGET_VERIFIED] = true;
      fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
    }

    // verify proxy contract
    if (!(DEPLOY_LOG_PORTAL_PROXY_VERIFIED in dLog) && !skipVerify) {
      await verifyContractCode(hardhat, portalAddr, []);
      dLog[DEPLOY_LOG_PORTAL_PROXY_VERIFIED] = true;
      fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
    }
  });

task('upgradePortal', 'Upgrade portal')
  .addParam('skipVerify', 'Skip verify', false, types.boolean, true)
  .setAction(async (taskArgs, hardhat) => {
    let skipVerify = taskArgs.skipVerify;
    console.log('skipVerify', skipVerify);

    const { deployLogPath, deployLog } = createOrGetDeployLog(DEPLOY_PORTAL_LOG_PREFIX, hardhat.network.name);
    const dLog = deployLog as any;
    const contractAddr = dLog[DEPLOY_LOG_PORTAL_PROXY];
    if (contractAddr === undefined) {
      console.log('portal address not exist');
      return;
    }
    console.log('portal', contractAddr);
    const oldContractTargetAddr = dLog[DEPLOY_LOG_PORTAL_TARGET];
    if (oldContractTargetAddr === undefined) {
      console.log('portal target address not exist');
      return;
    }
    console.log('portal old target', oldContractTargetAddr);

    const contractDeployer = new ChainContractDeployer(hardhat);
    await contractDeployer.init();

    console.log('upgrade portal...');
    const contractName = getPortalContractName();
    const contract = await contractDeployer.upgradeProxy(contractName, contractAddr, {
      unsafeAllow: ['constructor'],
    });
    const tx = await getDeployTx(contract);
    console.log('upgrade tx', tx?.hash);
    const newContractTargetAddr = await getImplementationAddress(hardhat.ethers.provider, contractAddr);
    dLog[DEPLOY_LOG_PORTAL_TARGET] = newContractTargetAddr;
    console.log('portal new target', newContractTargetAddr);
    fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));

    // verify target contract
    if (!skipVerify) {
      await verifyContractCode(hardhat, newContractTargetAddr, []);
      dLog[DEPLOY_LOG_PORTAL_TARGET_VERIFIED] = true;
      fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
    }
  });

task('deployPortalTarget', 'Deploy portal target')
  .addOptionalParam('skipVerify', 'Skip verify', false, types.boolean)
  .setAction(async (taskArgs, hardhat) => {
    let skipVerify = taskArgs.skipVerify;
    console.log('skip verify contracts?', skipVerify);

    const contractDeployer = new ChainContractDeployer(hardhat);
    await contractDeployer.init();
    const deployerWallet = contractDeployer.deployerWallet;

    const { deployLogPath, deployLog } = createOrGetDeployLog(DEPLOY_PORTAL_LOG_PREFIX, hardhat.network.name);
    const dLog = deployLog as any;
    dLog[DEPLOY_LOG_DEPLOYER] = await deployerWallet?.getAddress();
    fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));

    // deploy portal target
    let portalTargetAddr;
    console.log('deploy portal target...');
    const contractName = getPortalContractName();
    const contract = await contractDeployer.deployContract(contractName, []);
    const transaction = await getDeployTx(contract);
    console.log('deploy tx hash', transaction?.hash);
    portalTargetAddr = await contract.getAddress();
    dLog[DEPLOY_LOG_PORTAL_TARGET] = portalTargetAddr;
    fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
    console.log('portal', portalTargetAddr);

    // verify target contract
    if (!skipVerify) {
      await verifyContractCode(hardhat, portalTargetAddr, []);
      dLog[DEPLOY_LOG_PORTAL_TARGET_VERIFIED] = true;
      fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
    }
  });

task('encodeAddSourceToken', 'Get the calldata of add source token for portal')
  .addParam('source', 'Source token address', undefined, types.string, false)
  .addParam('merge', 'Merge token address', undefined, types.string, false)
  .addParam('limit', 'The amount(unit: ether) of limit with deposit all source token', undefined, types.string, false)
  .addParam('portal', 'The portal address (default get from portal deploy log)', undefined, types.string, true)
  .setAction(async (taskArgs, hre) => {
    let sourceToken = taskArgs.source;
    let mergeToken = taskArgs.merge;
    let limit = taskArgs.limit;
    let portal = taskArgs.portal;
    console.log('sourceToken', sourceToken);
    console.log('mergeToken', mergeToken);
    console.log('limit', limit);
    if (portal === undefined) {
      portal = readDeployContract(DEPLOY_PORTAL_LOG_PREFIX, DEPLOY_LOG_PORTAL_PROXY, hre.network.name);
    }
    console.log('portal address', portal);

    const mergeTokenContract = await hre.ethers.getContractAt(getMergeTokenContractName(), mergeToken);
    const decimals = await mergeTokenContract.decimals();
    const limitValue = hre.ethers.parseUnits(limit, decimals);
    console.log('limitValue', limitValue.toString());

    const portalContract = await hre.ethers.getContractAt(getPortalContractName(), portal);
    const calldata = portalContract.interface.encodeFunctionData('addSourceToken', [
      sourceToken,
      mergeToken,
      limitValue,
    ]);
    console.log('calldata', calldata);

    return calldata;
  });

task('encodeRemoveSourceToken', 'Get the calldata of remove source token for portal')
  .addParam('source', 'Source token address', undefined, types.string, false)
  .addParam('portal', 'The portal address (default get from portal deploy log)', undefined, types.string, true)
  .setAction(async (taskArgs, hre) => {
    let sourceToken = taskArgs.source;
    let portal = taskArgs.portal;
    console.log('sourceToken', sourceToken);
    if (portal === undefined) {
      portal = readDeployContract(DEPLOY_PORTAL_LOG_PREFIX, DEPLOY_LOG_PORTAL_PROXY, hre.network.name);
    }
    console.log('portal address', portal);

    const portalContract = await hre.ethers.getContractAt(getPortalContractName(), portal);
    const calldata = portalContract.interface.encodeFunctionData('removeSourceToken', [sourceToken]);
    console.log('calldata', calldata);

    return calldata;
  });

task('encodeUpdateDepositStatus', 'Get the calldata of update deposit status for portal')
  .addParam('source', 'Source token address', undefined, types.string, false)
  .addParam('lock', 'The lock status of deposit', undefined, types.boolean, false)
  .addParam('portal', 'The portal address (default get from portal deploy log)', undefined, types.string, true)
  .setAction(async (taskArgs, hre) => {
    let sourceToken = taskArgs.source;
    let lock = taskArgs.lock;
    let portal = taskArgs.portal;
    console.log('sourceToken', sourceToken);
    console.log('lock status', lock);
    if (portal === undefined) {
      portal = readDeployContract(DEPLOY_PORTAL_LOG_PREFIX, DEPLOY_LOG_PORTAL_PROXY, hre.network.name);
    }
    console.log('portal address', portal);

    const portalContract = await hre.ethers.getContractAt(getPortalContractName(), portal);
    const calldata = portalContract.interface.encodeFunctionData('updateDepositStatus', [sourceToken, lock]);
    console.log('calldata', calldata);

    return calldata;
  });

task('encodeUpdateDepositLimit', 'Get the calldata of update deposit limit for portal')
  .addParam('source', 'Source token address', undefined, types.string, false)
  .addParam('limit', 'The amount(unit: ether) of limit with deposit all source token', undefined, types.string, false)
  .addParam('portal', 'The portal address (default get from portal deploy log)', undefined, types.string, true)
  .setAction(async (taskArgs, hre) => {
    let sourceToken = taskArgs.source;
    let limit = taskArgs.limit;
    let portal = taskArgs.portal;
    console.log('sourceToken', sourceToken);
    console.log('limit', limit);
    if (portal === undefined) {
      portal = readDeployContract(DEPLOY_PORTAL_LOG_PREFIX, DEPLOY_LOG_PORTAL_PROXY, hre.network.name);
    }
    console.log('portal address', portal);

    const portalContract = await hre.ethers.getContractAt(getPortalContractName(), portal);
    const sourceTokenInfos = await portalContract.getSourceTokenInfos(sourceToken);
    const mergeToken = (sourceTokenInfos as any).mergeToken;

    const mergeTokenContract = await hre.ethers.getContractAt(getMergeTokenContractName(), mergeToken);
    const decimals = await mergeTokenContract.decimals();
    const limitValue = hre.ethers.parseUnits(limit, decimals);
    console.log('limitValue', limitValue.toString());

    const calldata = portalContract.interface.encodeFunctionData('setDepositLimit', [sourceToken, limitValue]);
    console.log('calldata', calldata);

    return calldata;
  });

task('encodeGrantSecurityCouncilRole', 'Get the calldata of grant the security council role for portal')
  .addParam('securityCouncil', 'The Security Council address', undefined, types.string, false)
  .addParam('portal', 'The portal address (default get from portal deploy log)', undefined, types.string, true)
  .setAction(async (taskArgs, hre) => {
    let securityCouncilAddr = taskArgs.securityCouncil;
    console.log('The Security Council Address', securityCouncilAddr);
    let portal = taskArgs.portal;
    if (portal === undefined) {
      portal = readDeployContract(DEPLOY_PORTAL_LOG_PREFIX, DEPLOY_LOG_PORTAL_PROXY, hre.network.name);
    }
    console.log('portal address', portal);

    const portalContract = await hre.ethers.getContractAt(getPortalContractName(), portal);
    const calldata = portalContract.interface.encodeFunctionData('grantSecurityCouncilRole', [securityCouncilAddr]);
    console.log('calldata', calldata);

    return calldata;
  });
