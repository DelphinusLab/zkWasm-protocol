"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
describe("setVerifier", function () {
    it("The vidBeforeSet should not be 0", async function () {
        // Get proxy contract
        const { deployer } = await (0, hardhat_1.getNamedAccounts)();
        const proxy = await hardhat_1.ethers.getContract('Proxy', deployer);
        let infoBeforeSet = await proxy.getProxyInfo();
        (0, chai_1.expect)(infoBeforeSet["verifier"]).to.not.equal(0n);
    });
    it("The vidAfterSet should be 0", async function () {
        // Get proxy contract
        const { deployer } = await (0, hardhat_1.getNamedAccounts)();
        const proxy = await hardhat_1.ethers.getContract('Proxy', deployer);
        await proxy.setVerifier("0x0000000000000000000000000000000000000000");
        let infoAfterSet = await proxy.getProxyInfo();
        (0, chai_1.expect)(infoAfterSet["verifier"]).to.equal(0n);
    });
});
