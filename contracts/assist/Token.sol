// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract Token is ERC20{
  constructor(address proxy) ERC20("MemeDisco", "MMD") {
    _mint(msg.sender, 2*1e9 * 1e18); //2 billion
    _mint(proxy, 8*1e9 * 1e18);      //8 billion
  }
  function getBalance() public view returns (uint256) {
    return balanceOf(msg.sender);
  }
}
