"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bn_js_1 = __importDefault(require("bn.js"));
const index_1 = require("../src/index");
const chai_1 = require("chai");
const test_utils_1 = require("./test_utils");
const hardhat_1 = require("hardhat");
const prepare_test_1 = require("./prepare_test");
const initial_root = new Uint8Array([166, 157, 178, 62, 35, 83, 140, 56, 9, 235, 134, 184, 20, 145, 63, 43, 245, 186, 75, 233, 43, 42, 187, 217, 104, 152, 219, 89, 125, 199, 161, 9]);
const withdraw_root = new Uint8Array([146, 154, 4, 1, 65, 7, 114, 67, 209, 68, 222, 153, 65, 139, 137, 45, 124, 86, 61, 115, 142, 90, 166, 41, 22, 133, 154, 149, 141, 76, 198, 11]);
const l1account = "D91A86B4D8551290655caCED21856eF6E532F2D4";
describe("deposit_withdraw_test", async function () {
    // use the funtion when you do not want to set hard code
    async function getCurrentRoot() {
        // Get proxy contract
        const { deployer } = await (0, hardhat_1.getNamedAccounts)();
        const proxy = await hardhat_1.ethers.getContract('Proxy', deployer);
        let proxyInfo = await proxy.getProxyInfo();
        let currentRoot = proxyInfo.merkle_root.toString();
        return currentRoot;
    }
    it("The return value of test_verify should not be null or undefined", async function () {
        await (0, prepare_test_1.prepare_test)();
        const chainId = await (0, hardhat_1.getChainId)();
        // Get proxy contract
        const { deployer } = await (0, hardhat_1.getNamedAccounts)();
        const proxy = await hardhat_1.ethers.getContract('Proxy', deployer);
        // Get the address of the proxy contract
        const proxyAddress = await proxy.getAddress();
        let txwithdraw = new index_1.TxWithdraw(new bn_js_1.default(0), new bn_js_1.default(1).shln(12), new index_1.Address("D91A86B4D8551290655caCED21856eF6E532F2D4"), Number(chainId));
        let txdatawithdraw = new index_1.TxData(new bn_js_1.default(withdraw_root, 16, "be"), new bn_js_1.default(initial_root, 16, "be"), [txwithdraw]);
        let resWithdraw = await (0, test_utils_1.test_verify)(proxy, txdatawithdraw, "withdraw");
        (0, chai_1.expect)(resWithdraw).to.not.equal(null);
        (0, chai_1.expect)(typeof (resWithdraw)).to.not.equal("undefined");
    });
});
