"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const func = async function (hre) {
    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = hre.deployments;
    await deploy("Token", {
        from: deployer,
        log: true
    });
    await deploy("Gas", {
        from: deployer,
        log: true
    });
};
exports.default = func;
func.tags = ['DeployToken'];
