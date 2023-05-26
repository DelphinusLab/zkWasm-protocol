"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenContract = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const client_1 = require("web3subscriber/src/client");
const contractsinfo_1 = require("zkwasm-deployment/config/contractsinfo");
class TokenContract extends client_1.DelphinusContract {
    constructor(web3, address, account) {
        super(web3, TokenContract.getJsonInterface(), address, account);
    }
    static getJsonInterface() {
        return contractsinfo_1.contractsInfo.interfaceMap.gas;
    }
    static getContractAddress(chainId) {
        return contractsinfo_1.contractsInfo.addressMap.testToken[chainId].address;
    }
    approve(address, amount) {
        return this.getWeb3Contract().methods.approve(address, amount).send();
    }
    balanceOf(account) {
        return __awaiter(this, void 0, void 0, function* () {
            let amount = yield this.getWeb3Contract().methods.balanceOf(account).call();
            return new bn_js_1.default(amount, 10);
        });
    }
    allowanceOf(account, spender) {
        return __awaiter(this, void 0, void 0, function* () {
            let amount = yield this.getWeb3Contract().methods.allowance(account, spender).call();
            return new bn_js_1.default(amount, 10);
        });
    }
    mint(amount) {
        return this.getWeb3Contract().methods.mint(amount).send();
    }
    transfer(address, amount) {
        return this.getWeb3Contract()
            .methods.transfer(address, amount)
            .send();
    }
}
exports.TokenContract = TokenContract;
//# sourceMappingURL=token.js.map