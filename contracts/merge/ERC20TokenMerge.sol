// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @author zk.link
contract ERC20TokenMerge is Initializable {
    using SafeERC20 for IERC20;

    /// @dev A mapping source token address => merge token address
    mapping(IERC20 sourceToken => IERC20 mergeToken) public mergeTokenAddress;

    /// @dev Contract is expected to be used as proxy implementation.
    /// @dev Disable the initialization to prevent Parity hack.
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the bridge contract for later use. Expected to be used in the proxy.
    function initialize() external initializer {
    }

    /// @notice Deposit source token to mint merge token
    function deposit(
        IERC20 _sourceToken,
        uint256 _amount,
        address _receiver
    ) external {

    }

    /// @notice Burn merge token and get source token back
    function withdraw(IERC20 _sourceToken, uint256 _amount, address _receiver) external {

    }
}
