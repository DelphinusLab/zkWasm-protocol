// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
//import "@openzeppelin/contracts/utils/Counters.sol";
contract Token is ERC20{
  constructor() ERC20("Memedisco Token", "Di") {
    _mint(msg.sender, 2e9 * 1e18); //2 billion
  }
  function getBalance() public view returns (uint256) {
    return balanceOf(msg.sender);
  }
}
