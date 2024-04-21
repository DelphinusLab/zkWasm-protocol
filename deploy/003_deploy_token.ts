import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
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

export default func;
func.tags = ['DeployToken'];