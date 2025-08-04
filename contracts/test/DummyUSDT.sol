// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DummyUSDT is ERC20, Ownable {
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimals_;
        _mint(msg.sender, initialSupply);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
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
        require(balanceOf(msg.sender) < 1000000 * 10**_decimals, "Already have enough tokens");
        _mint(msg.sender, 100000 * 10**_decimals); // Mint 100,000 tokens
    }
} 