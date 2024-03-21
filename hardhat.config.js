require('@nomicfoundation/hardhat-toolbox');
require('@openzeppelin/hardhat-upgrades');
require('@matterlabs/hardhat-zksync-deploy');
require('@matterlabs/hardhat-zksync-solc');
require('@matterlabs/hardhat-zksync-verify');
require('@matterlabs/hardhat-zksync-upgradable');
require('solidity-coverage');
require('hardhat-abi-exporter');
require('dotenv').config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const hardhatUserConfig = {
  abiExporter: {
    path: './abi',
    runOnCompile: true,
    clear: true,
    flat: true,
    spacing: 2,
    only: ['contracts/.*.sol'],
    format: 'json',
  },
  solidity: {
    compilers: [
      {
        version: '0.8.23',
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  defaultNetwork: process.env.DEFAULT_NETWORK || 'hardhat',
  networks: {
    hardhat: {
      zksync: false,
    },
    zklinkGoerli: {
      url: 'https://goerli.rpc.zklink.io',
      ethNetwork: 'goerli',
      verifyURL: 'https://goerli.explorer.zklink.io/contract_verification',
      zksync: true,
    },
  },
  zksolc: {
    version: '1.3.22',
    settings: {},
  },
  mocha: {
    timeout: 600000,
  },
};

module.exports = hardhatUserConfig;
