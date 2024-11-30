const { ethers } = require("hardhat");
import * as constants from "./const.ts";

async function main() {
	const proxy = await ethers.getContractAt("Proxy", constants.proxyAddress);

	const token = await ethers.getContractAt("Token", constants.tokenAddress);

        var tx = await token.approve(proxy.address, ethers.utils.parseUnits("1000","ether")); //for deposit test
	await tx.wait();

	const result = await proxy.topup(0, 2, 3, 10);
	await result.wait();
	console.log("result:", result)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
