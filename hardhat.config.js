require('@nomicfoundation/hardhat-ethers');
require('@matterlabs/hardhat-zksync-deploy');
require('@matterlabs/hardhat-zksync-solc');
require('@matterlabs/hardhat-zksync-verify');
require('@matterlabs/hardhat-zksync-upgradable');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const hardhatUserConfig = {
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
  networks: {
    hardhat: {
      zksync: true,
    },
    zklinkSepoliaTest: {
      url: 'https://sepolia.rpc.zklink.network',
      ethNetwork: 'https://sepolia-rollup.arbitrum.io/rpc',
      verifyURL: 'https://sepolia.verification.zklink.network/contract_verification',
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
