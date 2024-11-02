import { expect } from "chai";
const { ethers } = require("hardhat");
import * as constants from "./const.ts";
const BN = require('bn.js');
import { U8ArrayUtil, AddressUtil, NumberUtil } from './lib.ts'

const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
//    await helpers.setBalance(constants.addr, ethers.utils.parseUnits("1000","ether"));
    await setup();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

async function setup() {
    //1. deploy proxy contract
    const Proxy = await hre.ethers.getContractFactory("Proxy");

    let root_bn = new BN(constants.initial_root, 16, "le");
    console.log(root_bn);
    console.log("0x"+root_bn.toString(16));
    const proxy = await Proxy.deploy(constants.chain_id, "0x" + root_bn.toString(16));
    await proxy.deployed();

    console.log("Proxy address: ", proxy.address);

    //2. depoly testtoken
    const Token = await hre.ethers.getContractFactory("Token");
    const token = await Token.deploy();
    await token.deployed();
    const l1token = await proxy._l1_address(token.address)
    console.log("tokenaddr, l1tokenaddr(encoded)", token.address, l1token);

    //var tx = await token.approve(proxy.address, ethers.utils.parseUnits("1000","ether")); //for deposit test
    //await tx.wait();

    const localToken = await proxy._is_local(l1token)
    console.log(localToken);

    var tx = await proxy.addToken(l1token);
    await tx.wait();

    console.log(await proxy.allTokens());

    tx = await token.transfer(proxy.address, ethers.utils.parseUnits("1000000","ether")); //tbd
    await tx.wait();

    //3. set verifier
    //del verifier deployed by del
    //const DummyVerifier = await hre.ethers.getContractFactory("DummyVerifier");
    //const dummyVerifier = await DummyVerifier.deploy();
    //await dummyVerifier.deployed();
    //tx = await proxy.setVerifier(dummyVerifier.address);

    tx = await proxy.setVerifier(constants.verifyAddress);
    await tx.wait();

    const verifier = await proxy.verifier();
    //expect(verifier.toLowerCase()).to.equal(dummyVerifier.address.toLowerCase());
    console.log("in-use verifier address:", verifier);


    //4. addTransaction.. must match with op_code, 0 is deposit, 1 is withdraw
    const Withdraw = await hre.ethers.getContractFactory("Withdraw");
    const withdraw = await Withdraw.deploy();
    await withdraw.deployed();

    //const Deposit = await hre.ethers.getContractFactory("Deposit");
    //const deposit = await Deposit.deploy();
    //await deposit.deployed();

    console.log("Withdraw address: ", withdraw.address);
    //console.log("Deposit address: ", deposit.address);
    //must add deposit first!!! make sure op_code = 0 is deposit
    //var tx = await proxy.addTransaction(deposit.address, true);
    //await tx.wait()
    //const depositTransaction = await proxy._get_transaction(0);
    //expect(depositTransaction).to.equal(deposit.address);

    tx = await proxy.addTransaction(withdraw.address, true);
    await tx.wait()
    const withdrawTransaction = await proxy._get_transaction(0);
    expect(withdrawTransaction).to.equal(withdraw.address);

    tx = await proxy.setSettler(constants.settlerAddress);
    await tx.wait();
    console.log("set settler complete");

    console.log("setup completed!");


    //Start test
    //Send amount of token into Proxy contract
    //A user can withdraw token from Proxy after zkpoof passed
    //A user can withdraw more if he stake token into Proxy

    return;
}

