// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC20PermitUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import {IERC20MergeToken} from "../interfaces/IERC20MergeToken.sol";

contract ERC20MergeToken is ERC20PermitUpgradeable, IERC20MergeToken {
    address public immutable manager;

    modifier onlyManager() {
        require(msg.sender == manager, "ERC20MergeToken: forbidden");
        _;
    }

    /// @dev Contract is expected to be used as proxy implementation.
    /// @dev Disable the initialization to prevent Parity hack.
    constructor(address _manager) {
        _disableInitializers();

        manager = _manager;
    }

    /// @notice Initializes the bridge contract for later use. Expected to be used in the proxy.
    function initialize(string memory name_, string memory symbol_) external initializer {
        __ERC20_init_unchained(name_, symbol_);
        __ERC20Permit_init(name_);
    }

    function mint(address _receiver, uint256 _amount) external override onlyManager {
        require(msg.sender == manager, "ERC20MergeToken: forbidden");
        _mint(_receiver, _amount);
    }

    function burn(address _from, uint256 _amount) external override onlyManager {
        require(msg.sender == manager, "ERC20MergeToken: forbidden");
        _burn(_from, _amount);
    }
}
