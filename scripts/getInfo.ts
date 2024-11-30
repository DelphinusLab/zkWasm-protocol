
import * as constants from "./const.ts";
const BN = require('bn.js');
const { ethers } = require("hardhat");

async function main() {
	const proxy = await ethers.getContractAt("Proxy", constants.proxyAddress);

    const result = await proxy.getProxyInfo();
	console.log("result:", result)

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
