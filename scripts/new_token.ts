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
    const proxy = await ethers.getContractAt("Proxy", constants.proxyAddress);
    //2. depoly testtoken
    const Token = await hre.ethers.getContractFactory("Token");
    const token = await Token.deploy(proxy.address);
    await token.deployed();
    console.log("tokenaddr, ", token.address);
    //let tx = await token.transfer(proxy.address, ethers.utils.parseUnits("1000000","ether")); //tbd
    //await tx.wait();
    return;
}

