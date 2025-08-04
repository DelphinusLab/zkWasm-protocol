"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const func = async function (hre) {
    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = hre.deployments;
    let chainId = await hre.getChainId();
    console.log("deploying at netid:", chainId);
    await deploy("Withdraw", {
        from: deployer,
        log: true
    });
    await deploy("TokenLaunch", {
        from: deployer,
        log: true
    });
};
exports.default = func;
func.tags = ['DeployUtils'];
