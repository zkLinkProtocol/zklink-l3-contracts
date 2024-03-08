// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20MergeToken} from "../interfaces/IERC20MergeToken.sol";

contract ERC20MergeToken is ERC20, IERC20MergeToken {
    address public immutable MERGE_TOKEN_PORTAL;

    modifier onlyPortal() {
        require(msg.sender == MERGE_TOKEN_PORTAL, "ERC20MergeToken: forbidden");
        _;
    }

    constructor(address _mergeTokenPortal, string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        MERGE_TOKEN_PORTAL = _mergeTokenPortal;
    }

    function mint(address _receiver, uint256 _amount) external override onlyPortal {
        _mint(_receiver, _amount);
    }

    function burn(address _from, uint256 _amount) external override onlyPortal {
        _burn(_from, _amount);
    }
}
