// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";

contract AdminRoleUpgrade {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;
 
    EnumerableSetUpgradeable.AddressSet private _admins;

    event AdminAdded(address indexed account);
    event AdminRemoved(address indexed account);

    // constructor() {
    //     _addAdmin(msg.sender);
    // }

    modifier onlyAdmin() {
        require(
            isAdmin(msg.sender),
            "AdminRole: caller does not have the Admin role"
        );
        _;
    }

    function isAdmin(address account) public view returns (bool) {
        return _admins.contains(account);
    }

    function allAdmins() public view returns (address[] memory admins) {
        admins = new address[](_admins.length());
        for (uint256 i = 0; i < _admins.length(); i++) {
            admins[i] = _admins.at(i);
        }
    }

    function batchAddAdmin(address[] memory amounts) public onlyAdmin{
        for(uint256 i=0; i < amounts.length; i++){
            addAdmin(amounts[i]);
        }
    }

    function addAdmin(address account) public onlyAdmin {
        _addAdmin(account);
    }

    function removeAdmin(address account) public onlyAdmin {
        _removeAdmin(account);
    }

    function renounceAdmin() public {
        _removeAdmin(msg.sender);
    }

    function _addAdmin(address account) internal {
        _admins.add(account);
        emit AdminAdded(account);
    }
    
    function _removeAdmin(address account) internal {
        _admins.remove(account);
        emit AdminRemoved(account);
    }
}
