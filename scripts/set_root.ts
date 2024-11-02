
import * as constants from "./const.ts";
const BN = require('bn.js');
const { ethers } = require("hardhat");

let merkle_root = new BigUint64Array([
    14789582351289948625n,
    10919489180071018470n,
    10309858136294505219n,
    2839580074036780766n,
]);

/*
//https://explorer.zkwasmhub.com/task/6721c53968ab73c6b3b7cde7
let merkle_root = new BigUint64Array([
15674159884983843273n,
18321888757817666288n,
3751546579130456245n, 
1453530948194099690n
]);
*/

    const combinedRoot = merkle_root[0] * BigInt(2**192) +
                         merkle_root[1] * BigInt(2**128) +
                         merkle_root[2] * BigInt(2**64) +
			 merkle_root[3];

async function main() {
	const proxy = await ethers.getContractAt("Proxy", constants.proxyAddress);

	//let root_bn = new BN(constants.initial_root, 16, "le");
    let root_bn = combinedRoot;
    console.log(root_bn);
    console.log("0x"+root_bn.toString(16));

	const result = await proxy.setMerkle("0x" + root_bn.toString(16));
	await result.wait();
	console.log("result:", result)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
