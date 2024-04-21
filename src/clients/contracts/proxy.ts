import { TxDeposit } from "../../index";
import { TxBinder } from "web3subscriber/src/txbinder";
import { ethers, getNamedAccounts } from "hardhat";
import BN from "bn.js";
import { Token } from "../../../typechain-types";

export interface RidInfo {
  rid: BN;
  batch_size: BN;
}

export class ProxyContract {
  address: string;

  constructor(address: string) {
    this.address = address;
  }

  async approve_deposit (
    txdeposit: TxDeposit,
    l1account: string
  ) {
    const txbinder = new TxBinder();

    // Bind a callback to the snapshot event
    txbinder.register_snapshot("Approve", () => {
      console.log("Approve snapshot");
    });

    //TODO assert txdeposit is TxDeposit

    // Get proxy contract
    const { deployer } = await getNamedAccounts();
    const token = await ethers.getContract<Token>('Token', deployer);

    let allowance = await token.allowance(
      "0x" + l1account,
      this.address
    );
    console.log("Allowance is :", allowance.toString());
    txbinder.snapshot("Approve");
    if (allowance.toString() < txdeposit.amount.toString()) {
      if (allowance != BigInt(0)) {
        await txbinder.execute(
          "Approve",
          () => token.approve(this.address, BigInt(0))
        );
      }
      await txbinder.execute(
        "Approve",
        () => token.approve(
          this.address,
          BigInt(2) ** BigInt(256) - BigInt(1)
        )
      );
    }
    console.log("Deposit Info:", txdeposit);
  }
}