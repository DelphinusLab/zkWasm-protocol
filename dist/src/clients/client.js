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
exports.withL1Client = exports.L1Client = exports.dataToBN = exports.getChargeAddress = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const client_1 = require("web3subscriber/src/client");
const addresses_1 = require("web3subscriber/src/addresses");
const proxy_1 = require("./contracts/proxy");
const token_1 = require("./contracts/token");
const gas_1 = require("./contracts/gas");
const provider_1 = require("web3subscriber/src/provider");
const L1ADDR_BITS = 160;
function getDelphinusProviderFromConfig(config) {
    // FIXME: use ethers
    if (config.privateKey === "") {
        return new provider_1.DelphinusWsProvider(config.wsSource);
    }
    else {
        return new provider_1.DelphinusHDWalletProvider(config.privateKey, config.rpcSource);
    }
}
const contractsinfo_1 = require("zkwasm-deployment/config/contractsinfo");
function getChargeAddress(deviceId) {
    let chargeAddress = contractsinfo_1.contractsInfo.addressMap.gasToken[deviceId].address;
    let deviceIdHex = parseInt(deviceId).toString(16);
    let encodedChargeAddress = "0x" +
        (0, addresses_1.encodeL1address)(chargeAddress.substring(2), deviceIdHex).toString(16);
    return encodedChargeAddress;
}
exports.getChargeAddress = getChargeAddress;
function dataToBN(data) {
    if (data.toHex) {
        data = data.toHex();
    }
    return new bn_js_1.default(data, 16);
}
exports.dataToBN = dataToBN;
class L1Client {
    constructor(config, clientMode) {
        if (clientMode) {
            this.web3 = new client_1.Web3BrowsersMode();
        }
        else {
            this.web3 = new client_1.Web3ProviderMode({
                provider: getDelphinusProviderFromConfig(config),
                monitorAccount: config.monitorAccount,
            });
        }
        this.config = config;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`init_proxy on %s`, this.config.chainName);
            yield this.web3.connect();
            yield this.switchNet();
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.web3.close();
        });
    }
    getChainIdHex() {
        return "0x" + new bn_js_1.default(this.config.deviceId).toString(16);
    }
    getDefaultAccount() {
        return this.web3.getDefaultAccount();
    }
    getProxyContract(account) {
        return new proxy_1.ProxyContract(this.web3, proxy_1.ProxyContract.getContractAddress(this.config.deviceId), account);
    }
    getGasContract(address, account) {
        return new gas_1.GasContract(this.web3, address || gas_1.GasContract.getContractAddress(this.config.deviceId), account);
    }
    getTokenContract(address, account) {
        return new token_1.TokenContract(this.web3, address || token_1.TokenContract.getContractAddress(this.config.deviceId), account);
    }
    switchNet() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.web3.switchNet(this.getChainIdHex(), this.config.chainName, this.config.rpcSource, this.config.nativeCurrency, this.config.blockExplorer);
        });
    }
    /**
     *
     * @param address address must start with 0x
     * @returns
     */
    encodeL1Address(address) {
        if (address.substring(0, 2) != "0x") {
            throw "address must start with 0x";
        }
        const addressHex = address.substring(2);
        const chex = this.getChainIdHex().substring(2);
        return (0, addresses_1.encodeL1address)(addressHex, chex);
    }
}
exports.L1Client = L1Client;
function withL1Client(config, clientMode, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        const l1Client = new L1Client(config, clientMode);
        yield l1Client.init();
        try {
            return yield cb(l1Client);
        }
        finally {
            yield l1Client.close();
        }
    });
}
exports.withL1Client = withL1Client;
//# sourceMappingURL=client.js.map