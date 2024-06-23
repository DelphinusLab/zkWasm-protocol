import BN from "bn.js";
import { DelphinusContract } from "web3subscriber/src/client";
import { Signer, Provider } from "ethers";
import { contractsInfo } from "zkwasm-deployment/config/contractsinfo";

export class TokenContract extends DelphinusContract {
  constructor(address: string, signerOrProvider: Signer | Provider) {
    super(address, TokenContract.getJsonInterface().abi, signerOrProvider);
  }

  static getJsonInterface(): any {
    return contractsInfo.interfaceMap.gas;
  }

  static getContractAddress(chainId: string) {
    return contractsInfo.addressMap.testToken[chainId].address;
  }

  approve(address: string, amount: BigInt) {
    return this.getEthersContract().approve.send(address, amount);
  }

  async balanceOf(account: string): Promise<BN> {
    let amount = await this.getEthersContract().balanceOf.staticCall(account);
    console.log("balanceOf", amount);
    return new BN(amount, 10);
  }

  async allowanceOf(account: string, spender: string): Promise<bigint> {
    let amount = (await this.getEthersContract().allowance(
      account,
      spender
    )) as bigint;
    console.log("allowanceOf", amount);
    return amount;
  }

  mint(amount: BigInt) {
    return this.getEthersContract().mint(amount);
  }

  transfer(address: string, amount: BigInt) {
    return this.getEthersContract().transfer.send(address, amount);
  }
}
