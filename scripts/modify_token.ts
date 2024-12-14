const { ethers } = require("hardhat");
import * as constants from "./const.ts";

async function main() {
    const proxy = await ethers.getContractAt("Proxy", constants.proxyAddress);

    const l1token = await proxy._l1_address(constants.tokenAddress)
    console.log("tokenaddr, l1tokenaddr(encoded)", constants.tokenAddress, l1token);

    const localToken = await proxy._is_local(l1token)
    console.log(localToken);

    var tx = await proxy.modifyToken(1, l1token);
    await tx.wait();

    console.log(await proxy.allTokens());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
