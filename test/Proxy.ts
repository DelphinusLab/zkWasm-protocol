import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import { viem } from "hardhat";
import { bytesToBigInt } from "viem";

describe("Proxy contract", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployProxyFixture() {
    // Deploy the Proxy contract
    const initial_root = new Uint8Array([
      166, 157, 178, 62, 35, 83, 140, 56, 9, 235, 134,
      184, 20, 145, 63, 43, 245, 186, 75, 233, 43, 42,
      187, 217, 104, 152, 219, 89, 125, 199, 161, 9
    ]);
    let root = bytesToBigInt(initial_root);
    const publicClient = await viem.getPublicClient();
    const chainId = await publicClient.getChainId();
    const proxy = await viem.deployContract("Proxy", [chainId, root]);

    const dummyVerifier = await viem.deployContract("DummyVerifier");
    await proxy.write.setVerifier([dummyVerifier.address]);
    return { proxy };
  }

  describe("getProxyInfo", function () {
    it("The vidBeforeSet should not be 0", async function () {
      const { proxy } = await loadFixture(deployProxyFixture);

      let infoBeforeSet: any = await proxy.read.getProxyInfo();
      expect(infoBeforeSet["verifier"]).to.not.equal(0n);
    });

    it("The vidAfterSet should be 0", async function () {
      const { proxy } = await loadFixture(deployProxyFixture);

      await proxy.write.setVerifier(["0x0000000000000000000000000000000000000000"]);
      let infoAfterSet: any = await proxy.read.getProxyInfo();
      expect(infoAfterSet["verifier"]).to.equal(0n);
    });
  });
});