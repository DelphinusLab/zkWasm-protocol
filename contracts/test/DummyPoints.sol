// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DummyPoints is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }
    
    // Allow minting for testing purposes
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    // Allow anyone to mint for testing (remove in production)
    function mintForTesting(uint256 amount) external {
        _mint(msg.sender, amount);
    }
    
    // Faucet function for easy testing
    function faucet() external {
        require(balanceOf(msg.sender) < 1000000 * 10**18, "Already have enough points");
        _mint(msg.sender, 10000 * 10**18); // Mint 10,000 points
    }
} 