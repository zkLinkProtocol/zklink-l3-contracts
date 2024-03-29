// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {IMergeTokenPortal} from "../interfaces/IMergeTokenPortal.sol";
import {IERC20MergeToken} from "../interfaces/IERC20MergeToken.sol";

contract MergeTokenPortal is IMergeTokenPortal, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address public commiteeRoleAddress;

    /// @dev A mapping source token address => source token status.
    mapping(address sourceToken => SourceTokenInfo) public sourceTokenInfoMap;

    modifier onlyOwnerOrCommitee() {
        require(
            _msgSender() == owner() || _msgSender() == commiteeRoleAddress,
            "Only owner or commitee can call this function"
        );
        _;
    }

    /// @dev Contract is expected to be used as proxy implementation.
    /// @dev Disable the initialization to prevent Parity hack.
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the portal contract.
    function initialize(address _commiteeRoleAddress) external initializer {
        __UUPSUpgradeable_init_unchained();
        __Ownable_init_unchained();
        __ReentrancyGuard_init_unchained();

        commiteeRoleAddress = _commiteeRoleAddress;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // can only called by owner
    }

    /// @notice Get source token info
    function getSourceTokenInfos(address _sourceToken) public view override returns (SourceTokenInfo memory) {
        return sourceTokenInfoMap[_sourceToken];
    }

    /// @notice Deposit source token to mint merge token
    function deposit(address _sourceToken, uint256 _amount, address _receiver) external override nonReentrant {
        require(_amount > 0, "Deposit amount is zero");
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        require(tokenInfo.isSupported, "Source token is not supported");
        require(!tokenInfo.isLocked, "Source token is locked");

        uint256 afterBalance = tokenInfo.balance + _amount;
        require(afterBalance <= tokenInfo.depositLimit, "Source token deposit limit exceeded");
        tokenInfo.balance = afterBalance;

        IERC20Upgradeable(_sourceToken).safeTransferFrom(msg.sender, address(this), _amount);

        address mergeToken = tokenInfo.mergeToken;
        IERC20MergeToken(mergeToken).mint(_receiver, _amount);

        emit DepositToMerge(_sourceToken, mergeToken, msg.sender, _amount, _receiver);
    }

    /// @notice Burn merge token and get source token back
    function withdraw(address _sourceToken, uint256 _amount, address _receiver) external override nonReentrant {
        require(_amount > 0, "Withdraw amount is zero");
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        require(tokenInfo.isSupported, "Source token is not supported");

        require(tokenInfo.balance >= _amount, "Source Token balance is not enough");
        unchecked {
            tokenInfo.balance -= _amount;
        }

        address mergeToken = tokenInfo.mergeToken;
        IERC20MergeToken(mergeToken).burn(msg.sender, _amount);

        IERC20Upgradeable(_sourceToken).safeTransfer(_receiver, _amount);

        emit WithdrawFromMerge(_sourceToken, mergeToken, msg.sender, _amount, _receiver);
    }

    /// @notice Add source token
    function addSourceToken(address _sourceToken, address _mergeToken, uint256 _depositLimit) external onlyOwner {
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        require(!tokenInfo.isSupported, "Source token is already supported");
        require(_sourceToken != address(0) && _mergeToken != address(0), "Invalid token address");
        sourceTokenInfoMap[_sourceToken] = SourceTokenInfo({
            isSupported: true,
            isLocked: false,
            mergeToken: _mergeToken,
            balance: 0,
            depositLimit: _depositLimit
        });

        emit SourceTokenAdded(_sourceToken, _mergeToken, _depositLimit);
    }

    /// @notice Remove source token
    function removeSourceToken(address _sourceToken) external onlyOwnerOrCommitee {
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        require(tokenInfo.balance == 0, "Source Token balance is not zero");
        delete sourceTokenInfoMap[_sourceToken];

        emit SourceTokenRemoved(_sourceToken);
    }

    /// @notice Lock source token
    function updateDepositStatus(address _sourceToken, bool _isLocked) external onlyOwnerOrCommitee {
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        require(tokenInfo.isSupported, "Source token is not supported");

        tokenInfo.isLocked = _isLocked;

        emit SourceTokenLocked(_sourceToken, _isLocked);
    }

    /// @notice Set deposit limit
    function setDepositLimit(address _sourceToken, uint256 _limit) external onlyOwner {
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        require(tokenInfo.isSupported, "Source token is not supported");

        tokenInfo.depositLimit = _limit;

        emit DepositLimitUpdated(_sourceToken, _limit);
    }

    /// @notice Grant commitee role
    function grantCommiteeRole(address _commiteeRoleAddress) external onlyOwner {
        require(_commiteeRoleAddress != address(0), "Invalid commitee role address");
        address oldCommiteeRoleAddress = commiteeRoleAddress;
        require(oldCommiteeRoleAddress != _commiteeRoleAddress, "Commitee role address is the same");
        commiteeRoleAddress = _commiteeRoleAddress;

        emit CommiteeUpdated(oldCommiteeRoleAddress, _commiteeRoleAddress);
    }
}
