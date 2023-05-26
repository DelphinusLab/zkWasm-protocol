"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GasContract = void 0;
const client_1 = require("web3subscriber/src/client");
const contractsinfo_1 = require("zkwasm-deployment/config/contractsinfo");
class GasContract extends client_1.DelphinusContract {
    constructor(web3, address, account) {
        super(web3, GasContract.getJsonInterface(), address, account);
    }
    static getJsonInterface() {
        return contractsinfo_1.contractsInfo.interfaceMap.gas;
    }
    static getContractAddress(chainId) {
        return contractsinfo_1.contractsInfo.addressMap.gasToken[chainId].address;
    }
    approve(address, amount) {
        return this.getWeb3Contract().methods.approve(address, amount).send();
    }
    balanceOf(account) {
        return this.getWeb3Contract().methods.balanceOf(account).call();
    }
    mint(amount) {
        return this.getWeb3Contract().methods.mint(amount).send();
    }
    transfer(address, amount) {
        return this.getWeb3Contract().methods.transfer(address, amount).send();
    }
}
exports.GasContract = GasContract;
//# sourceMappingURL=gas.js.map