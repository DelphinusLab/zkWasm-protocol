import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  let chainId = await hre.getChainId();
  console.log("deploying at netid:", chainId);

  await deploy("Deposit", {
    from: deployer,
    log: true
  });
  await deploy("Withdraw", {
    from: deployer,
    log: true
  });
  await deploy("Swap", {
    from: deployer,
    log: true
  });
  await deploy("Retrive", {
    from: deployer,
    log: true
  });
  await deploy("Supply", {
    from: deployer,
    log: true
  });
  await deploy("AddPool", {
    from: deployer,
    log: true
  });
  await deploy("SetKey", {
    from: deployer,
    log: true
  });
};

export default func;
func.tags = ['DeployUtils'];