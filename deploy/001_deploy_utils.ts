import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  let chainId = await hre.getChainId();
  console.log("deploying at netid:", chainId);

  await deploy("Withdraw", {
    from: deployer,
    log: true
  });

};

export default func;
func.tags = ['DeployUtils'];
