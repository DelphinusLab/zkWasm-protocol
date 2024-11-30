import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { BN } from "bn.js";
import { Proxy } from '../typechain-types';

const initialRoot = new Uint8Array([166, 157, 178, 62, 35, 83, 140, 56, 9, 235, 134, 184, 20, 145, 63, 43, 245, 186, 75, 233, 43, 42, 187, 217, 104, 152, 219, 89, 125, 199, 161, 9]);

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  let rootBn = new BN(initialRoot, 16, "be");
  let rootBigInt = BigInt("0x" + rootBn.toString(16));
  let chainId = await hre.getChainId();
  console.log("netid:", chainId);

  await deploy("Proxy", {
    from: deployer,
    args: [chainId, rootBigInt],
    log: true
  });
  /*await deploy("ZKPVerifier", {
    from: deployer,
    args: [chainId],
    log: true
  });*/
  await deploy("DummyVerifier", {
    from: deployer,
    log: true
  });

  const withdraw = await get("Withdraw");
  //const zkverifier = await get("ZKPVerifier");
  const dmverifier = await get("DummyVerifier");
  
  const proxy = await hre.ethers.getContract<Proxy>("Proxy", deployer);
  await proxy.addTransaction(withdraw.address, true);
  // await proxy.addVerifier(zkverifier.address);
  await proxy.setVerifier(dmverifier.address);
};

export default func;
func.tags = ['DeployBridge'];