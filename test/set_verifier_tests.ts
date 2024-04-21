import { expect } from "chai";
import { ethers, getNamedAccounts } from "hardhat";
import { Proxy } from "../typechain-types";

describe("setVerifier", function () {
  it("The vidBeforeSet should not be 0", async function () {
    // Get proxy contract
    const { deployer } = await getNamedAccounts();
    const proxy = await ethers.getContract<Proxy>('Proxy', deployer);

    let infoBeforeSet: any = await proxy.getProxyInfo();
    expect(infoBeforeSet["verifier"]).to.not.equal(0n);
  });

  it("The vidAfterSet should be 0", async function () {
    // Get proxy contract
    const {deployer} = await getNamedAccounts();
    const proxy = await ethers.getContract<Proxy>('Proxy', deployer);

    await proxy.setVerifier("0x0000000000000000000000000000000000000000");
    let infoAfterSet: any = await proxy.getProxyInfo();
    expect(infoAfterSet["verifier"]).to.equal(0n);
  });
});