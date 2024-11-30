const { ethers } = require("hardhat");
import * as constants from "./const.ts";

async function main() {
	const proxy = await ethers.getContractAt("Proxy", constants.proxyAddress);

	const result = await proxy.setSettler(constants.settlerAddress);
	await result.wait();
	console.log("result:", result)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
