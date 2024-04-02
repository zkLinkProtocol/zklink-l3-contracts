import * as fs from 'fs';
import {
  verifyContractCode,
  createOrGetDeployLog,
  ChainContractDeployer,
  getDeployTx,
  readDeployContract,
} from './utils';
import {
  DEPLOY_GOVERNANCE_LOG_PREFIX,
  DEPLOY_LOG_GOVERNANCE,
  DEPLOY_LOG_GOVERNANCE_ADMIN,
  DEPLOY_LOG_GOVERNANCE_SECURITY_COUNCIL,
  DEPLOY_LOG_GOVERNANCE_MIN_DELAY,
  DEPLOY_LOG_GOVERNANCE_VERIFIED,
  DEPLOY_LOG_DEPLOYER,
  DEPLOY_LOG_DEPLOY_TX_HASH,
  DEPLOY_LOG_DEPLOY_BLOCK_NUMBER,
} from './deploy_log_name';
import { task, types } from 'hardhat/config';

task('deployGovernance', 'Deploy governance')
  .addParam('admin', 'The admin address (default is the deployer)', undefined, types.string, true)
  .addParam(
    'securityCouncil',
    'The security council address (default is the zero address)',
    '0x0000000000000000000000000000000000000000',
    types.string,
    true,
  )
  .addParam('minDelay', 'The initial minimum delay (in seconds) to be set for operations', 0, types.int, true)
  .addParam('skipVerify', 'Skip verify', false, types.boolean, true)
  .setAction(async (taskArgs, hardhat) => {
    const contractDeployer = new ChainContractDeployer(hardhat);
    await contractDeployer.init();
    const deployerWallet = contractDeployer.deployerWallet;
    const deployerAddr = await deployerWallet?.getAddress();

    let adminAddr = taskArgs.admin;
    if (adminAddr === undefined) {
      adminAddr = deployerAddr;
    }
    const securityCouncilAddr = taskArgs.securityCouncil;
    const minDelay = taskArgs.minDelay;
    const skipVerify = taskArgs.skipVerify;
    console.log('admin', adminAddr);
    console.log('securityCouncil', securityCouncilAddr);
    console.log('minDelay', minDelay);
    console.log('skip verify contracts?', skipVerify);

    const { deployLogPath, deployLog } = createOrGetDeployLog(DEPLOY_GOVERNANCE_LOG_PREFIX, hardhat.network.name);
    const dLog = deployLog as any;
    dLog[DEPLOY_LOG_DEPLOYER] = deployerAddr;
    fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));

    // deploy governance
    let governanceAddr;
    const allConstructParams = [adminAddr, securityCouncilAddr, minDelay];
    if (!(DEPLOY_LOG_GOVERNANCE in dLog)) {
      console.log('deploy governance...');
      const contract = await contractDeployer.deployContract('Governance', allConstructParams);
      const transaction = await getDeployTx(contract);
      governanceAddr = await contract.getAddress();
      dLog[DEPLOY_LOG_GOVERNANCE] = governanceAddr;
      dLog[DEPLOY_LOG_DEPLOY_TX_HASH] = transaction.hash;
      dLog[DEPLOY_LOG_DEPLOY_BLOCK_NUMBER] = transaction.blockNumber;
      dLog[DEPLOY_LOG_GOVERNANCE_ADMIN] = adminAddr;
      dLog[DEPLOY_LOG_GOVERNANCE_SECURITY_COUNCIL] = securityCouncilAddr;
      dLog[DEPLOY_LOG_GOVERNANCE_MIN_DELAY] = minDelay;
      fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
    } else {
      governanceAddr = dLog[DEPLOY_LOG_GOVERNANCE];
    }
    console.log('governance', governanceAddr);

    // verify governance
    if (!(DEPLOY_LOG_GOVERNANCE_VERIFIED in dLog) && !skipVerify) {
      await verifyContractCode(hardhat, governanceAddr, allConstructParams);
      dLog[DEPLOY_LOG_GOVERNANCE_VERIFIED] = true;
      fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
    }
  });

task('encodeUUPSUpgradeCalldata', 'Encode calldata for uups upgrade')
  .addParam('newImplementation', 'The new implementation', undefined, types.string, false)
  .setAction(async (taskArgs, hardhat) => {
    const newImplementation = taskArgs.newImplementation;
    console.log('new implementation', newImplementation);

    const contractFactory = await hardhat.ethers.getContractAt(
      'UUPSUpgradeable',
      '0x0000000000000000000000000000000000000000',
    );
    const upgradeToCalldata = contractFactory.interface.encodeFunctionData('upgradeTo', [newImplementation]);
    console.log('upgradeTo calldata', upgradeToCalldata);
  });

task('encodeOperation', 'Encode operation')
  .addParam('target', 'The target address', undefined, types.string, false)
  .addParam('value', 'The call value to target', undefined, types.int, false)
  .addParam('data', 'The call data to target', undefined, types.string, false)
  .addParam(
    'predecessor',
    'The predecessor of operation',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    types.string,
    true,
  )
  .addParam(
    'salt',
    'The salt of operation',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    types.string,
    true,
  )
  .addParam('delay', 'The delay', 0, types.int, true)
  .setAction(async (taskArgs, hardhat) => {
    const target = taskArgs.target;
    const value = taskArgs.value;
    const data = taskArgs.data;
    const predecessor = taskArgs.predecessor;
    const salt = taskArgs.salt;
    const delay = taskArgs.delay;
    console.log('target', target);
    console.log('value', value);
    console.log('data', data);
    console.log('predecessor', predecessor);
    console.log('salt', salt);
    console.log('delay', delay);

    const governanceAddr = readDeployContract(
      DEPLOY_GOVERNANCE_LOG_PREFIX,
      DEPLOY_LOG_GOVERNANCE,
      hardhat.network.name,
    );
    if (!governanceAddr) {
      console.log('governance address not found');
      return;
    }
    console.log('governance', governanceAddr);
    const governance = await hardhat.ethers.getContractAt('Governance', governanceAddr);
    if (value > 0) {
      const governanceBalance = await hardhat.ethers.provider.getBalance(governanceAddr);
      console.log('governance balance', governanceBalance);
      if (governanceBalance < value) {
        console.log('insufficient balance for execute transaction, please transfer some eth to governance');
        return;
      }
    }

    const call = {
      target,
      value,
      data,
    };
    const operation = {
      calls: [call],
      predecessor: predecessor,
      salt: salt,
    };

    const scheduleTransparentCalldata = governance.interface.encodeFunctionData('scheduleTransparent', [
      operation,
      delay,
    ]);
    console.log('scheduleTransparentCalldata', scheduleTransparentCalldata);

    const executeCalldata = governance.interface.encodeFunctionData('execute', [operation]);
    console.log('executeCalldata', executeCalldata);
  });

task('encodeUpdateDelay', 'Encode update delay')
  .addParam('delay', 'The delay', undefined, types.int, false)
  .addParam('gov', 'The governance address (default get from governance deploy log)', undefined, types.string, true)
  .setAction(async (taskArgs, hardhat) => {
    const delay = taskArgs.delay;
    let gov = taskArgs.gov;
    console.log('delay', delay);
    if (gov === undefined) {
      gov = readDeployContract(DEPLOY_GOVERNANCE_LOG_PREFIX, DEPLOY_LOG_GOVERNANCE, hardhat.network.name);
    }
    console.log('governance', gov);
    const governance = await hardhat.ethers.getContractAt('Governance', gov);
    const minDelay = await governance.minDelay();
    if (delay < minDelay) {
      console.log(`delay must be greater than or equal to minDelay (${minDelay})`);
      return;
    }

    const updateDelayCalldata = governance.interface.encodeFunctionData('updateDelay', [delay]);
    console.log('updateDelayCalldata', updateDelayCalldata);
  });

task('encodeUpdateSecurityCouncil', 'Encode update security council')
  .addParam('securityCouncil', 'The security council address', undefined, types.string, false)
  .addParam('gov', 'The governance address (default get from governance deploy log)', undefined, types.string, true)
  .setAction(async (taskArgs, hardhat) => {
    const securityCouncil = taskArgs.securityCouncil;
    let gov = taskArgs.gov;
    console.log('security council', securityCouncil);
    if (gov === undefined) {
      gov = readDeployContract(DEPLOY_GOVERNANCE_LOG_PREFIX, DEPLOY_LOG_GOVERNANCE, hardhat.network.name);
    }
    console.log('governance', gov);
    const governance = await hardhat.ethers.getContractAt('Governance', gov);
    const oldSecurityCouncilAddr = await governance.securityCouncil();
    if (oldSecurityCouncilAddr === securityCouncil) {
      console.log('security council is the same as the old one');
      return;
    }

    const updateSecurityCouncilCalldata = governance.interface.encodeFunctionData('updateSecurityCouncil', [
      securityCouncil,
    ]);
    console.log('updateSecurityCouncilCalldata', updateSecurityCouncilCalldata);
  });
