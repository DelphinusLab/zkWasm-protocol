import { DelphinusContract } from "web3subscriber/src/client";
import { contractsInfo } from "zkwasm-deployment/config/contractsinfo";
import { Signer, Provider } from "ethers";

export class GasContract extends DelphinusContract {
  constructor(address: string, signerOrProvider: Signer | Provider) {
    super(address, GasContract.getJsonInterface(), signerOrProvider);
  }

  static getJsonInterface(): any {
    return contractsInfo.interfaceMap.gas;
  }

  static getContractAddress(chainId: string) {
    return contractsInfo.addressMap.gasToken[chainId].address;
  }

  approve(address: string, amount: BigInt) {
    return this.getEthersContract().approve.send(address, amount);
  }

  balanceOf(account: string) {
    return this.getEthersContract().balanceOf.call(account);
  }

  mint(amount: BigInt) {
    return this.getEthersContract().mint.send(amount);
  }

  transfer(address: string, amount: BigInt) {
    return this.getEthersContract().transfer.send(address, amount);
  }
}
