const { ethers } = require("hardhat");
import * as constants from "./const.ts";

async function main() {
	const proxy = await ethers.getContractAt("Proxy", constants.proxyAddress);

	const result = await proxy.setOwner("0x3Fac30320E03487439eb2bfFE7471D040380BcD9");
	await result.wait();
	console.log("result:", result)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
