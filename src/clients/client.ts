import { ethers, network } from "hardhat";

export async function deployContract() {
  // Deploy the Proxy contract
  const initial_root = new Uint8Array([
    166, 157, 178, 62, 35, 83, 140, 56, 9, 235, 134,
    184, 20, 145, 63, 43, 245, 186, 75, 233, 43, 42,
    187, 217, 104, 152, 219, 89, 125, 199, 161, 9
  ]);
  let root = ethers.toBigInt(initial_root);
  const chainId = network.config.chainId;
  const proxy = await ethers.deployContract("Proxy", [chainId, root]);

  // Deploy the Token contract
  const token = await ethers.deployContract("Token");

  // Get the address of the Token contract
  const tokenAddress = await token.getAddress();

  // Get the owner from the hardhat node
  const [owner] = await ethers.getSigners();

  return { proxy, token, root, chainId, tokenAddress, owner }
}