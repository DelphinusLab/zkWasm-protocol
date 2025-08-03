// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LaunchpadToken is ERC20 {
    uint8 private _decimals;
    uint256 public projectId;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint8 decimals_,
        uint256 _projectId,
        address initialOwner
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        projectId = _projectId;
        _mint(initialOwner, totalSupply);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
} 