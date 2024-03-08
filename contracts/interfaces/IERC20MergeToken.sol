// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

interface IERC20MergeToken {
    /// @notice Mint merge token
    function mint(address _receiver, uint256 _amount) external;

    /// @notice Burn merge token
    function burn(address _from, uint256 _amount) external;
}
