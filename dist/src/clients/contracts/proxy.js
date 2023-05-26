"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.ProxyContract = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const retry = __importStar(require("retry"));
const client_1 = require("web3subscriber/src/client");
const addresses_1 = require("web3subscriber/src/addresses");
const pbinder_1 = require("web3subscriber/src/pbinder");
const contractsinfo_1 = require("zkwasm-deployment/config/contractsinfo");
const registeredTokens = contractsinfo_1.contractsInfo.tokens.concat(contractsinfo_1.extraTokens);
function hexcmp(x, y) {
    const xx = new bn_js_1.default(x, "hex");
    const yy = new bn_js_1.default(y, "hex");
    return xx.eq(yy);
}
class ProxyContract extends client_1.DelphinusContract {
    constructor(web3, address, account) {
        super(web3, ProxyContract.getJsonInterface(), address, account);
    }
    static getJsonInterface() {
        return contractsinfo_1.contractsInfo.interfaceMap.proxy;
    }
    static getContractAddress(chainId) {
        return contractsinfo_1.contractsInfo.addressMap.proxy[chainId].address;
    }
    static checkAddHexPrefix(hexStr) {
        let s = hexStr;
        if (s.substring(0, 2) != "0x")
            s = "0x" + s;
        return s;
    }
    getProxyInfo() {
        return this.getWeb3Contract().methods.getProxyInfo().call();
    }
    allTokens() {
        return this.getWeb3Contract().methods.allTokens().call();
    }
    addToken(tokenid) {
        return this.getWeb3Contract().methods.addToken(tokenid).send();
    }
    _verify(calldata, verifydata, verifyInstance, aux, instances, vid, rid) {
        const calldataChecked = ProxyContract.checkAddHexPrefix(calldata);
        const tx = this.getWeb3Contract().methods.verify(calldataChecked, verifydata, verifyInstance, aux, instances, vid, {
            rid: rid.rid.toString(),
            batch_size: rid.batch_size.toString()
        });
        return tx.send();
    }
    _deposit(tokenAddress, amount, l2account) {
        return this.getWeb3Contract()
            .methods.deposit(tokenAddress, amount, l2account)
            .send();
    }
    _setVerifier(verifierAddress) {
        return this.getWeb3Contract()
            .methods.setVerifier(verifierAddress)
            .send();
    }
    verify(calldata, verifydata, verifyInstance, aux, instances, vid, rid) {
        const pbinder = new pbinder_1.PromiseBinder();
        return pbinder.return(() => __awaiter(this, void 0, void 0, function* () {
            return yield pbinder.bind("Verify", this._verify(calldata, verifydata, verifyInstance, aux, instances, vid, rid));
        }));
    }
    deposit(tokenContract, amount, l1account, l2account) {
        const pbinder = new pbinder_1.PromiseBinder();
        return pbinder.return(() => __awaiter(this, void 0, void 0, function* () {
            let allowance = yield tokenContract.allowanceOf(l1account, this.address());
            console.log("Allowance is :", allowance.toString());
            pbinder.snapshot("Approve");
            if (allowance.lt(amount)) {
                if (!allowance.isZero()) {
                    yield pbinder.bind("Approve", tokenContract.approve(this.address(), new bn_js_1.default(0)));
                }
                yield pbinder.bind("Approve", tokenContract.approve(this.address(), new bn_js_1.default(2).pow(new bn_js_1.default(256)).sub(new bn_js_1.default(1))));
            }
            console.log("Deposit amount:", amount.toString());
            pbinder.snapshot("Deposit");
            return yield pbinder.bind("Deposit", this._deposit(tokenContract.address(), amount, l2account));
        }));
    }
    setVerifier(verifierAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._setVerifier(verifierAddress);
        });
    }
    extractChainInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            let tokenInfos = yield this.allTokens();
            let tokens = tokenInfos
                .filter((t) => t.token_uid != "0")
                .map((token) => {
                let [cid, address] = (0, addresses_1.decodeL1address)(token.token_uid);
                let registeredToken = registeredTokens.find((x) => hexcmp(x.address, address) && x.chainId == cid);
                return {
                    address: address,
                    name: registeredToken.name,
                    chainId: cid,
                    wei: registeredToken.wei,
                    index: tokenInfos.findIndex((x) => x.token_uid == token.token_uid),
                };
            });
            let chain_list = Array.from(new Set(tokens.map((x) => x.chainId)));
            let token_list = chain_list.map((chain_id) => ({
                chainId: chain_id,
                chainName: contractsinfo_1.Chains[chain_id],
                tokens: tokens.filter((x) => x.chainId == chain_id),
                enable: true,
            }));
            return token_list;
        });
    }
    getTokenInfo(idx) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = (yield this.allTokens())[idx];
            let [cid, addr] = (0, addresses_1.decodeL1address)(token.token_uid);
            let registeredToken = registeredTokens.find((x) => hexcmp(x.address, addr) && x.chainId == cid);
            return {
                chainId: cid,
                chainName: contractsinfo_1.Chains[cid],
                tokenAddress: addr,
                wei: registeredToken.wei,
                tokenName: registeredToken.name,
                index: idx,
            };
        });
    }
    getMetaData() {
        return __awaiter(this, void 0, void 0, function* () {
            //generic retry function that takes a promise and will retry 5 times.
            let retryGet = (tryFunction) => {
                let operation = retry.operation({
                    retries: 5,
                    factor: 1,
                    minTimeout: 1 * 1000,
                    maxTimeout: 4 * 1000,
                    randomize: true,
                });
                return new Promise((resolve, reject) => {
                    operation.attempt((currentAttempt) => __awaiter(this, void 0, void 0, function* () {
                        console.log("Attempt to get Info:", currentAttempt);
                        try {
                            let info = yield tryFunction();
                            resolve(info);
                        }
                        catch (err) {
                            if (operation.retry(err)) {
                                return;
                            }
                            reject(operation.mainError());
                        }
                    }));
                });
            };
            console.log("getting Proxy info");
            let _proxyInfo = yield retryGet(() => this.getProxyInfo());
            console.log("getting token info");
            let _tokens = yield retryGet(() => this.allTokens());
            console.log("getting chain info");
            let _chainInfo = yield retryGet(() => this.extractChainInfo());
            return {
                proxyInfo: _proxyInfo,
                tokens: _tokens,
                chainInfo: _chainInfo,
            };
        });
    }
}
exports.ProxyContract = ProxyContract;
//# sourceMappingURL=proxy.js.map