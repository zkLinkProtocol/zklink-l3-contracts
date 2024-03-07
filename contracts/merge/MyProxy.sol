// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

contract MyProxy is BeaconProxy {
    bytes32 internal data;
    constructor(address beaconAddress) BeaconProxy(beaconAddress, abi.encodePacked(data)) {
    data = keccak256("initialize()");
}
}