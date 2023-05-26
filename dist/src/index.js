"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenContract = exports.GasContract = exports.contractsInfo = exports.ProxyContract = exports.withL1Client = exports.L1Client = exports.dataToBN = exports.getChargeAddress = exports.TxData = exports.TxWithdraw = void 0;
const client_js_1 = require("./clients/client.js");
Object.defineProperty(exports, "getChargeAddress", { enumerable: true, get: function () { return client_js_1.getChargeAddress; } });
Object.defineProperty(exports, "dataToBN", { enumerable: true, get: function () { return client_js_1.dataToBN; } });
Object.defineProperty(exports, "L1Client", { enumerable: true, get: function () { return client_js_1.L1Client; } });
Object.defineProperty(exports, "withL1Client", { enumerable: true, get: function () { return client_js_1.withL1Client; } });
const proxy_js_1 = require("./clients/contracts/proxy.js");
Object.defineProperty(exports, "ProxyContract", { enumerable: true, get: function () { return proxy_js_1.ProxyContract; } });
const config_contracts_info_js_1 = require("./clients/config-contracts-info.js");
Object.defineProperty(exports, "contractsInfo", { enumerable: true, get: function () { return config_contracts_info_js_1.contractsInfo; } });
const gas_js_1 = require("./clients/contracts/gas.js");
Object.defineProperty(exports, "GasContract", { enumerable: true, get: function () { return gas_js_1.GasContract; } });
const token_js_1 = require("./clients/contracts/token.js");
Object.defineProperty(exports, "TokenContract", { enumerable: true, get: function () { return token_js_1.TokenContract; } });
const bn_js_1 = __importDefault(require("bn.js"));
const sha256_1 = __importDefault(require("crypto-js/sha256"));
const enc_hex_1 = __importDefault(require("crypto-js/enc-hex"));
class TxWithdraw {
    constructor(nonce, accountIndex, tokenIndex, amount, l1address, opcode) {
        this.nonce = nonce;
        this.accountIndex = accountIndex;
        this.tokenIndex = tokenIndex;
        this.amount = amount;
        this.l1address = l1address;
        this.opcode = new bn_js_1.default(1);
    }
    to_binary() {
        let bytes = [
            this.opcode.toBuffer("be", 1),
            this.nonce.toBuffer("be", 7),
            this.accountIndex.toBuffer("be", 4),
            this.tokenIndex.toBuffer("be", 4),
            this.amount.toBuffer("be", 32),
            this.l1address.toBuffer("be", 32),
        ]
            .map((x) => {
            return x.toString("hex");
        })
            .join("");
        return bytes;
    }
}
exports.TxWithdraw = TxWithdraw;
class TxData {
    constructor(o, n, txs) {
        this.oldroot = o;
        this.newroot = n;
        this.transactions = txs;
    }
    get_verifier_inputs() {
        let data = this.transactions.map((x) => x.to_binary()).join("");
        const hvalue = (0, sha256_1.default)(enc_hex_1.default.parse(data)).toString();
        const sha_low = new bn_js_1.default(hvalue.slice(0, 32), "hex", "be");
        const sha_high = new bn_js_1.default(hvalue.slice(32, 64), "hex", "be");
        return [this.oldroot, this.newroot, sha_low, sha_high];
    }
}
exports.TxData = TxData;
//# sourceMappingURL=index.js.map