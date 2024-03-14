require("@nomicfoundation/hardhat-toolbox");
require('solidity-coverage');
require('@nomiclabs/hardhat-ethers');
// require('@openzeppelin/hardhat-upgrades');
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.17",
      },
      {
        version: "0.8.23",
      },
    ],
    // version: "0.8.17",
  },
};
