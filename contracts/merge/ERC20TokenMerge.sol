// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
//import {INTO} from "@openzeppelin/contracts-upgradeable/token/ERC20/INTO.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./AdminRoleUpgrade.sol";
import "./INTO.sol";

contract ERC20TokenMerge is Initializable, AdminRoleUpgrade {
    using SafeERC20Upgradeable for INTO;

    INTO mergeToken;

    /// @dev A mapping source token address => merge token address
    mapping(INTO sourceToken => INTO mergeToken) public mergeTokenAddress;
    mapping(INTO sourceToken => bool) public sourceTokenMap;
    mapping(INTO sourceToken => uint256) public sourceTokenBalanceMap;
    mapping(INTO sourceToken => bool) public depositFlag;
    mapping(INTO sourceToken => uint256) public depositLimit;

    /// @dev Contract is expected to be used as proxy implementation.
    /// @dev Disable the initialization to prevent Parity hack.
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the bridge contract for later use. Expected to be used in the proxy.
    function initialize() external initializer {
        _addAdmin(msg.sender);
    }

    // Arbitrum
    // Bridged USDC = 0xff970a61a04b1ca14834a43f5de4533ebddb5cc8
    // Native USDC = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
    // => L3
    // L3_Arbitrum_Bridged_USDC = 0xff970a61a04b1ca14834a43f5de4533ebddb5cc9
    // L3_Arbitrum_Native_USDC = 0xaf88d065e77c8cC2239327C5EDb3A432268e5832

    // Linea
    // Bridged USDC = 0x176211869ca2b568f2a7d4ee941e073a821ee1ff
    // => L3
    // L3_Linea_Bridged_USDC = 0x176211869ca2b568f2a7d4ee941e073a821ee200

    // L3_USDC = [L3_Arbitrum_Bridged_USDC, L3_Arbitrum_Native_USDC, L3_Linea_Bridged_USDC, ....]

    /// @notice Deposit source token to mint merge token
    function deposit(INTO _sourceToken, uint256 _amount, address _receiver) external {
        require(sourceTokenMap[_sourceToken] == true, "not the token");
        require(depositLimit[_sourceToken] <= _amount, "exceed depositLimit");
        require(depositFlag[_sourceToken] == true, "can not deposit");
        INTO(_sourceToken).transferFrom(msg.sender, _receiver, _amount);
        sourceTokenBalanceMap[_sourceToken] += _amount;
        INTO(_sourceToken).mint(_receiver, _amount);
    }

    /// @notice Burn merge token and get source token back
    function withdraw(INTO _sourceToken, uint256 _amount, address _receiver) external {
        require(sourceTokenMap[_sourceToken] == true, "not the token");
        sourceTokenBalanceMap[_sourceToken] -= _amount;
        INTO(_sourceToken).burn(_amount);
        INTO(_sourceToken).transfer(_receiver, _amount);
    }

    function addToken(INTO _sourceToken) external onlyAdmin {
        sourceTokenMap[_sourceToken] = true;
        mergeTokenAddress[_sourceToken] = mergeToken;
    }

    function removeToken(INTO _sourceToken) external onlyAdmin {
        require(sourceTokenBalanceMap[_sourceToken] == 0, "can not remove");
        sourceTokenMap[_sourceToken] = false;
    }

    function disableDeposit(INTO _sourceToken) external onlyAdmin {
        require(sourceTokenMap[_sourceToken] == true, "already disable");
        depositFlag[_sourceToken] = false;
    }

    function getTokenInfo(INTO _sourceToken) external view returns (bool,uint256,bool,uint256) {
        return(sourceTokenMap[_sourceToken],
            sourceTokenBalanceMap[_sourceToken],
            depositFlag[_sourceToken],
            depositLimit[_sourceToken]);
    }

    // Beacon模式
    // 很多个MergeToken
    // MergeToken = Proxy(MergeTokenBeaconProxy(MergeTokenImplement))
}
