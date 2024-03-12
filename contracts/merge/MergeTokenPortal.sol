// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {IMergeTokenPortal} from "../interfaces/IMergeTokenPortal.sol";
import {IERC20MergeToken} from "../interfaces/IERC20MergeToken.sol";

contract MergeTokenPortal is IMergeTokenPortal, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    /// @dev MAX_UINT256
    uint256 public constant MAX_UINT256 = type(uint256).max;

    /// @dev Governance address
    address public immutable GOVERNANCE;

    /// @dev A mapping source token address => source token status.
    mapping(address sourceToken => SourceTokenInfo) public sourceTokenInfoMap;

    modifier onlyGovernance() {
        require(msg.sender == GOVERNANCE, "MergeTokenPortal: forbidden");
        _;
    }

    /// @dev Contract is expected to be used as proxy implementation.
    /// @dev Disable the initialization to prevent Parity hack.
    constructor(address _governance) {
        //_disableInitializers();

        GOVERNANCE = _governance;
    }

    /// @notice Initializes the portal contract.
    function initialize() external initializer {
        __UUPSUpgradeable_init();
        __Ownable_init();
        __ReentrancyGuard_init();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /// @notice Get source token info
    function getSourceTokenInfos(address _sourceToken) public view override returns (SourceTokenInfo memory) {
        return sourceTokenInfoMap[_sourceToken];
    }

    /// @notice Deposit source token to mint merge token
    function deposit(address _sourceToken, uint256 _amount, address _receiver) external override nonReentrant {
        require(_amount > 0, "ae0");
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        require(tokenInfo.isSupported == true, "ns");
        require(tokenInfo.isLocked == false, "dd");

        uint256 afterBalance;
        unchecked {
            afterBalance = tokenInfo.balance + _amount;
        }
        require(afterBalance <= tokenInfo.depositLimit, "el");
        //IERC20Upgradeable(_sourceToken).approve(address(this),_amount);
        IERC20Upgradeable(_sourceToken).approve(address(this), _amount);
        IERC20Upgradeable(_sourceToken).safeTransferFrom(msg.sender, address(this), _amount);
        tokenInfo.balance = afterBalance;

        address mergeToken = tokenInfo.mergeToken;
        IERC20MergeToken(mergeToken).mint(_receiver, _amount);

        emit DepositToMerge(_sourceToken, mergeToken, msg.sender, _amount, _receiver);
    }

    /// @notice Burn merge token and get source token back
    function withdraw(address _sourceToken, uint256 _amount, address _receiver) external override nonReentrant {
        require(_amount > 0, "ae0");
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        require(tokenInfo.isSupported == true, "ns");

        require(tokenInfo.balance >= _amount, "ib");
        unchecked {
            tokenInfo.balance -= _amount;
        }

        address mergeToken = tokenInfo.mergeToken;
        IERC20MergeToken(mergeToken).burn(msg.sender, _amount);

        IERC20Upgradeable(_sourceToken).safeTransfer(_receiver, _amount);

        emit WithdrawFromMerge(_sourceToken, mergeToken, msg.sender, _amount, _receiver);
    }

    /// @notice Add source token
    function addSourceToken(address _sourceToken, address _mergeToken, uint256 limit) external onlyGovernance {
        require(_sourceToken != address(0) && _mergeToken != address(0), "id");
        sourceTokenInfoMap[_sourceToken] = SourceTokenInfo({
            isSupported: true,
            isLocked: false,
            mergeToken: _mergeToken,
            balance: 0,
            depositLimit: limit
        });

        emit SourceTokenAdded(_sourceToken, _mergeToken, MAX_UINT256);
    }

    /// @notice Remove source token
    function removeSourceToken(address _sourceToken) external onlyGovernance {
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        require(tokenInfo.balance == 0, "bn0");
        delete sourceTokenInfoMap[_sourceToken];

        emit SourceTokenRemoved(_sourceToken);
    }

    /// @notice Lock source token
    function disableDeposit(address _sourceToken) external onlyGovernance {
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        require(tokenInfo.isSupported == true, "ns");

        tokenInfo.isLocked = true;
        emit SourceTokenLocked(_sourceToken, true);
    }

    /// @notice Set deposit limit
    function setDepositLimit(address _sourceToken, uint256 _limit) external onlyGovernance {
        SourceTokenInfo storage tokenInfo = sourceTokenInfoMap[_sourceToken];
        require(tokenInfo.isSupported == true, "ns");

        tokenInfo.depositLimit = _limit;

        emit DepositLimitUpdated(_sourceToken, _limit);
    }
}
