// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./LaunchToken.sol";

contract TokenFactory {

    address public admin;
    address[] public allTokens;

    event TokenCreated(
        address token,
        address creator,
        string name,
        string symbol,
        uint256 supply
    );

    constructor(address _admin) {
        admin = _admin;
    }

    // ساخت توکن جدید
    function createToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) public returns (address) {

        LaunchToken token = new LaunchToken(
            name,
            symbol,
            initialSupply,
            admin,
            msg.sender
        );

        allTokens.push(address(token));

        emit TokenCreated(
            address(token),
            msg.sender,
            name,
            symbol,
            initialSupply
        );

        return address(token);
    }

    // تعداد کل توکن‌ها
    function totalTokens() public view returns (uint256) {
        return allTokens.length;
    }

    // گرفتن همه توکن‌ها
    function getAllTokens() public view returns (address[] memory) {
        return allTokens;
    }
}
