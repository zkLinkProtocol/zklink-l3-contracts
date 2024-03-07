// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./AdminRole.sol";


contract INTO is ERC20Burnable, AdminRole {
    using SafeMath for uint256;

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_)
    {

    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function mint(address recipient_, uint256 amount_)
    public
    onlyAdmin
    returns (bool)
    {
        uint256 balanceBefore = balanceOf(recipient_);
        _mint(recipient_, amount_);
        uint256 balanceAfter = balanceOf(recipient_);

        return balanceAfter > balanceBefore;
    }

    function burn(uint256 amount) public override onlyAdmin {
        super.burn(amount);
    }

    function burnFrom(address account, uint256 amount)
    public
    override
    onlyAdmin
    {
        super.burnFrom(account, amount);
    }

}

