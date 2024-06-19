// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20MetadataUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {IMergeTokenPortal} from "../interfaces/IMergeTokenPortal.sol";
import {IERC20MergeToken} from "../interfaces/IERC20MergeToken.sol";

contract MergeTokenPortal is IMergeTokenPortal, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for IERC20MetadataUpgradeable;

    /// @dev A mapping source token address => source token status.
    mapping(address sourceToken => SourceTokenInfo) public sourceTokenInfoMap;

    // @dev Security Council address
    address public securityCouncil;

    /// @dev A mapping merge token address => is merge token supported.
    mapping(address mergeToken => mapping(address sourceToken => bool)) public isMergeTokenSupported;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[47] private __gap;

    modifier onlyOwnerOrSecurityCouncil() {
        require(
            _msgSender() == owner() || _msgSender() == securityCouncil,
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
    function initialize(address _securityCouncil) external initializer {
        __UUPSUpgradeable_init_unchained();
        __Ownable_init_unchained();
        __ReentrancyGuard_init_unchained();

        securityCouncil = _securityCouncil;
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
        require(_sourceToken != address(0), "Invalid source token address");
        require(_receiver != address(0), "Invalid receiver address");
        require(_amount > 0, "Deposit amount is zero");
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        require(tokenInfo.isSupported, "Source token is not supported");
        require(!tokenInfo.isLocked, "Source token is locked");

        uint256 afterBalance = tokenInfo.balance + _amount;
        require(afterBalance <= tokenInfo.depositLimit, "Source token deposit limit exceeded");
        tokenInfo.balance = afterBalance;

        uint256 _sourceTokenBeforeBalance = IERC20MetadataUpgradeable(_sourceToken).balanceOf(address(this));
        IERC20MetadataUpgradeable(_sourceToken).safeTransferFrom(msg.sender, address(this), _amount);
        uint256 _sourceTokenAfterBalance = IERC20MetadataUpgradeable(_sourceToken).balanceOf(address(this));
        require(_sourceTokenAfterBalance - _sourceTokenBeforeBalance == _amount, "Not support deflationary token");

        address mergeToken = tokenInfo.mergeToken;
        IERC20MergeToken(mergeToken).mint(_receiver, _amount);

        emit DepositToMerge(_sourceToken, mergeToken, msg.sender, _amount, _receiver);
    }

    /// @notice Burn merge token and get source token back
    function withdraw(address _sourceToken, uint256 _amount, address _receiver) external override nonReentrant {
        require(_sourceToken != address(0), "Invalid source token address");
        require(_receiver != address(0), "Invalid receiver address");
        require(_amount > 0, "Withdraw amount is zero");
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        require(tokenInfo.isSupported, "Source token is not supported");

        require(tokenInfo.balance >= _amount, "Source Token balance is not enough");
        unchecked {
            tokenInfo.balance -= _amount;
        }

        address mergeToken = tokenInfo.mergeToken;
        IERC20MergeToken(mergeToken).burn(msg.sender, _amount);
        uint256 _sourceTokenBeforeBalance = IERC20MetadataUpgradeable(_sourceToken).balanceOf(address(this));
        IERC20MetadataUpgradeable(_sourceToken).safeTransfer(_receiver, _amount);
        uint256 _sourceTokenAfterBalance = IERC20MetadataUpgradeable(_sourceToken).balanceOf(address(this));

        require(_sourceTokenAfterBalance + _amount == _sourceTokenBeforeBalance, "Not support deflationary token");

        emit WithdrawFromMerge(_sourceToken, mergeToken, msg.sender, _amount, _receiver);
    }

    /// @notice Add source token
    function addSourceToken(address _sourceToken, address _mergeToken, uint256 _depositLimit) external onlyOwner {
        require(_sourceToken != address(0) && _mergeToken != address(0), "Invalid token address");
        bool isSupported = sourceTokenInfoMap[_sourceToken].isSupported;
        require(!isSupported, "Source token is already supported");
        require(!isMergeTokenSupported[_mergeToken][_sourceToken], "Merge token is already supported");
        require(_sourceToken != _mergeToken, "Should not Match");
        uint8 _sourceTokenDecimals = IERC20MetadataUpgradeable(_sourceToken).decimals();
        uint8 _mergeTokenDecimals = IERC20MetadataUpgradeable(_mergeToken).decimals();
        require(_sourceTokenDecimals == _mergeTokenDecimals, "Token decimals are not the same");

        sourceTokenInfoMap[_sourceToken] = SourceTokenInfo({
            isSupported: true,
            isLocked: false,
            mergeToken: _mergeToken,
            balance: 0,
            depositLimit: _depositLimit
        });
        isMergeTokenSupported[_mergeToken][_sourceToken] = true;

        emit SourceTokenAdded(_sourceToken, _mergeToken, _depositLimit);
    }

    /// @notice Remove source token
    function removeSourceToken(address _sourceToken) external onlyOwnerOrSecurityCouncil {
        bool isSupported = sourceTokenInfoMap[_sourceToken].isSupported;
        require(isSupported, "Source token is already removed");
        uint256 balance = sourceTokenInfoMap[_sourceToken].balance;
        require(balance == 0, "Source Token balance is not zero");

        address mergeToken = sourceTokenInfoMap[_sourceToken].mergeToken;
        delete isMergeTokenSupported[mergeToken][_sourceToken];
        delete sourceTokenInfoMap[_sourceToken];

        emit SourceTokenRemoved(_sourceToken);
    }

    /// @notice Lock source token
    function updateDepositStatus(address _sourceToken, bool _isLocked) external onlyOwnerOrSecurityCouncil {
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        require(tokenInfo.isSupported, "Source token is not supported");

        tokenInfo.isLocked = _isLocked;

        emit SourceTokenStatusUpdated(_sourceToken, _isLocked);
    }

    /// @notice Set deposit limit
    function setDepositLimit(address _sourceToken, uint256 _limit) external onlyOwner {
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        require(tokenInfo.isSupported, "Source token is not supported");
        require(_limit >= tokenInfo.balance, "Invalid Specification");

        tokenInfo.depositLimit = _limit;

        emit DepositLimitUpdated(_sourceToken, _limit);
    }

    /// @notice Grant security council role
    function grantSecurityCouncilRole(address _securityCouncil) external onlyOwner {
        require(_securityCouncil != address(0), "Invalid the security council role address");
        address oldSecurityCouncil = securityCouncil;
        require(oldSecurityCouncil != _securityCouncil, "The Security Council role address is the same as old one");
        securityCouncil = _securityCouncil;

        emit SecurityCouncilUpdated(oldSecurityCouncil, _securityCouncil);
    }
}
