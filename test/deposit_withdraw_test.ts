import BN from "bn.js";
import { TxData, TxDeposit, TxWithdraw, Address } from "../src/index";
import { expect } from "chai";
import { ProxyContract } from "../src/clients/contracts/proxy";
import { root, chainId, test_verify } from "./test_utils";
import { ethers } from "hardhat";
import { prepare_test } from "./prepare_test";
import { Proxy } from "../typechain-types";

const initial_root: Uint8Array = new Uint8Array([166, 157, 178, 62, 35, 83, 140, 56, 9, 235, 134, 184, 20, 145, 63, 43, 245, 186, 75, 233, 43, 42, 187, 217, 104, 152, 219, 89, 125, 199, 161, 9]);
const withdraw_root: Uint8Array = new Uint8Array([146, 154, 4, 1, 65, 7, 114, 67, 209, 68, 222, 153, 65, 139, 137, 45, 124, 86, 61, 115, 142, 90, 166, 41, 22, 133, 154, 149, 141, 76, 198, 11]);
const l1account = "D91A86B4D8551290655caCED21856eF6E532F2D4";

describe("deposit_withdraw_test", async function () {
  // use the funtion when you do not want to set hard code
  async function getCurrentRoot() {
    // Deploy the Proxy contract
    const proxy: Proxy = await ethers.deployContract("Proxy", [chainId, root]);

    let proxyInfo = await proxy.getProxyInfo();
    let currentRoot: string = proxyInfo.merkle_root.toString();
    return currentRoot;
  }

  it("The return value of test_verify should not be null or undefined", async function () {
    await prepare_test();

    // Deploy the SetKey contract
    const setKey = await ethers.deployContract("SetKey");

    // Get the address of the SetKey contract
    const setKeyAddress = await setKey.getAddress();

    // Deploy the Deposit contract
    const deposit = await ethers.deployContract("Deposit");

    // Get the address of the Deposit contract
    const depositAddress = await deposit.getAddress();

    // Deploy the withdraw contract
    const withdraw = await ethers.deployContract("Withdraw");

    // Get the address of the withdraw contract
    const withdrawAddress = await withdraw.getAddress();

    // Deploy the Proxy contract
    const proxy: Proxy = await ethers.deployContract("Proxy", [chainId, root]);

    // Get the address of the proxy contract
    const proxyAddress = await proxy.getAddress();

    // Deploy the DummyVerifier contract
    const dummyVerifier = await ethers.deployContract("DummyVerifier");

    // Add transactions
    proxy.addTransaction(setKeyAddress, false);
    proxy.addTransaction(depositAddress, false);
    proxy.addTransaction(withdrawAddress, false);

    // Set verifier for the proxy contract
    proxy.setVerifier(dummyVerifier.getAddress());

    let txdeposit = new TxDeposit(
      new BN(0),
      new BN(0),
      new BN(0),
      new BN(1).shln(12),
      new Address("D91A86B4D8551290655caCED21856eF6E532F2D4")
    );
    let txdatadeposit = new TxData(
      new BN(initial_root, 16, "be"),
      new BN(withdraw_root, 16, "be"),
      [txdeposit]
    );
    let txwithdraw= new TxWithdraw(
      new BN(0),
      new BN(0),
      new BN(0),
      new BN(1).shln(12),
      new Address("D91A86B4D8551290655caCED21856eF6E532F2D4"),
      chainId
    );
    let txdatawithdraw = new TxData(
      new BN(withdraw_root, 16, "be"),
      new BN(initial_root, 16, "be"),
      [txwithdraw]
    );

    async function test_deposit() {
      const proxyContract = new ProxyContract(proxyAddress);
      await proxyContract.approve_deposit(txdeposit, l1account);
      return test_verify(
        proxy,
        txdatadeposit,
        "deposit"
      );
    }

    let resDeposit = await test_deposit();

    expect(resDeposit).to.not.equal(null);
    expect(typeof(resDeposit)).to.not.equal("undefined");

    let resWithdraw = await test_verify(proxy, txdatawithdraw, "withdraw");

    expect(resWithdraw).to.not.equal(null);
    expect(typeof(resWithdraw)).to.not.equal("undefined");
  });
});