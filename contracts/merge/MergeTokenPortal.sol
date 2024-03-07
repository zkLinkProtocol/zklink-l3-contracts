// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IMergeTokenPortal} from "../interfaces/IMergeTokenPortal.sol";
import {IERC20MergeToken} from "../interfaces/IERC20MergeToken.sol";

contract MergeTokenPortal is IMergeTokenPortal, UUPSUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    /// @dev MAX_UINT256
    uint256 public constant MAX_UINT256 = type(uint256).max;

    /// @dev Governance address
    address public immutable governance;

    /// @dev A mapping source token address => merge token address.
    mapping(address sourceToken => address mergeToken) public mergeTokenMap;

    /// @dev A mapping source token address => source token status.
    mapping(address sourceToken => SourceTokenInfo) public sourceTokenInfoMap;

    /// @dev Contract is expected to be used as proxy implementation.
    /// @dev Disable the initialization to prevent Parity hack.
    constructor(address _governance) {
        _disableInitializers();

        governance = _governance;
    }

    /// @notice Initializes the bridge contract for later use. Expected to be used in the proxy.
    function initialize() external initializer {
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyGovernance {}

    modifier onlyGovernance() {
        require(msg.sender == governance, "MergeTokenManager: forbidden");
        _;
    }

    function getMergeTokenAddress(address _sourceToken) public view override returns (address) {
        return mergeTokenMap[_sourceToken];
    }

    function getSourceTokenInfos(address _sourceToken) public view override returns (SourceTokenInfo memory) {
        return sourceTokenInfoMap[_sourceToken];
    }

    /// @notice Deposit source token to mint merge token
    function deposit(address _sourceToken, uint256 _amount, address _receiver) external override {
        require(_amount > 0, "amount is 0");
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        require(tokenInfo.isSupported == true, "not the token");
        require(tokenInfo.isLocked == false, "locked");

        require(tokenInfo.balance + _amount <= tokenInfo.depositLimit, "exceed depositLimit");

        IERC20Upgradeable(_sourceToken).safeTransferFrom(msg.sender, address(this), _amount);
        tokenInfo.balance += _amount;
        sourceTokenInfoMap[_sourceToken] = tokenInfo;
        IERC20MergeToken mergeToken = IERC20MergeToken(mergeTokenMap[_sourceToken]);
        mergeToken.mint(_receiver, _amount);

        emit DepositToMerge(_sourceToken, address(mergeToken), msg.sender, _amount, _receiver);
    }

    /// @notice Burn merge token and get source token back
    function withdraw(address _sourceToken, uint256 _amount, address _sender) external override {
        require(_amount > 0, "amount is 0");
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        require(tokenInfo.isSupported == true, "not the token");

        require(tokenInfo.balance >= _amount, "insufficient balance");
        tokenInfo.balance -= _amount;
        sourceTokenInfoMap[_sourceToken] = tokenInfo;
        IERC20MergeToken mergeToken = IERC20MergeToken(mergeTokenMap[_sourceToken]);
        mergeToken.burn(_sender, _amount);

        IERC20Upgradeable(_sourceToken).safeTransfer(_sender, _amount);

        emit WithdrawFromMerge(_sourceToken, address(mergeToken), _sender, _amount, _sender);
    }

    function addSourceToken(address _sourceToken, address _mergeToken) external onlyGovernance {
        require(_sourceToken != address(0) && _mergeToken != address(0), "MergeTokenManager: invalid source token");
        mergeTokenMap[_sourceToken] = _mergeToken;
        sourceTokenInfoMap[_sourceToken] = SourceTokenInfo({
            isSupported: true,
            isLocked: false,
            balance: 0,
            depositLimit: MAX_UINT256
        });

        emit SourceTokenAdded(_sourceToken, _mergeToken, MAX_UINT256);
    }

    function removeSourceToken(address _sourceToken) external onlyGovernance {
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        require(tokenInfo.balance == 0, "MergeTokenManager: token balance is not 0");
        delete mergeTokenMap[_sourceToken];
        delete sourceTokenInfoMap[_sourceToken];

        emit SourceTokenRemoved(_sourceToken);
    }

    function disableDeposit(address _sourceToken) external onlyGovernance {
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        bool isSupported = tokenInfo.isSupported;
        require(isSupported == true, "MergeTokenManager: token is not supported");
        tokenInfo.isLocked = true;
        sourceTokenInfoMap[_sourceToken] = tokenInfo;

        emit SourceTokenLocked(_sourceToken, true);
    }

    function setDepositLimit(address _sourceToken, uint256 _limit) external onlyGovernance {
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        bool isSupported = tokenInfo.isSupported;
        require(isSupported == true, "MergeTokenManager: token is not supported");
        tokenInfo.depositLimit = _limit;
        sourceTokenInfoMap[_sourceToken] = tokenInfo;

        emit DepositLimitUpdated(_sourceToken, _limit);
    }
}
