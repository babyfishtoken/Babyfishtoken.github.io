// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LaunchToken is ERC20, Ownable {

    bool public userMinted;

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address admin,
        address user
    ) ERC20(name, symbol) Ownable(admin) {

        // mint اولیه برای کاربر
        _mint(user, initialSupply);
        userMinted = true;
    }

    // فقط ادمین می‌تواند بعداً mint کند
    function adminMint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
