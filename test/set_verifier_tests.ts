import {
  loadFixture
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { root, chainId } from "./test_utils";

describe("setVerifier", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployProxyFixture() {
    // Deploy the Proxy contract
    const proxy = await ethers.deployContract("Proxy", [chainId, root]);

    // Deploy the DummyVerifier contract
    const dummyVerifier = await ethers.deployContract("DummyVerifier");

    // Set the verifier address in the proxy contract
    const verifierAddress = await dummyVerifier.getAddress();
    await proxy.setVerifier(verifierAddress);

    return { proxy };
  }

  it("The vidBeforeSet should not be 0", async function () {
    const { proxy } = await loadFixture(deployProxyFixture);

    let infoBeforeSet: any = await proxy.getProxyInfo();
    expect(infoBeforeSet["verifier"]).to.not.equal(0n);
  });

  it("The vidAfterSet should be 0", async function () {
    const { proxy } = await loadFixture(deployProxyFixture);

    await proxy.setVerifier("0x0000000000000000000000000000000000000000");
    let infoAfterSet: any = await proxy.getProxyInfo();
    expect(infoAfterSet["verifier"]).to.equal(0n);
  });
});