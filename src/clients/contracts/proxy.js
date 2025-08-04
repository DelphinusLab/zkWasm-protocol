"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyContract = void 0;
const txbinder_1 = require("web3subscriber/src/txbinder");
const hardhat_1 = require("hardhat");
class ProxyContract {
    constructor(address) {
        this.address = address;
    }
    async approve_deposit(txdeposit, l1account) {
        const txbinder = new txbinder_1.TxBinder();
        // Bind a callback to the snapshot event
        txbinder.register_snapshot("Approve", () => {
            console.log("Approve snapshot");
        });
        //TODO assert txdeposit is TxDeposit
        // Get proxy contract
        const { deployer } = await (0, hardhat_1.getNamedAccounts)();
        const token = await hardhat_1.ethers.getContract('Token', deployer);
        let allowance = await token.allowance("0x" + l1account, this.address);
        console.log("Allowance is :", allowance.toString());
        txbinder.snapshot("Approve");
        if (allowance.toString() < txdeposit.amount.toString()) {
            if (allowance != BigInt(0)) {
                await txbinder.execute("Approve", () => token.approve(this.address, BigInt(0)));
            }
            await txbinder.execute("Approve", () => token.approve(this.address, BigInt(2) ** BigInt(256) - BigInt(1)));
        }
        console.log("Deposit Info:", txdeposit);
    }
}
exports.ProxyContract = ProxyContract;
