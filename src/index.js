"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TxData = exports.TxWithdraw = exports.Address = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const sha256_1 = __importDefault(require("crypto-js/sha256"));
const enc_hex_1 = __importDefault(require("crypto-js/enc-hex"));
class Address {
    constructor(addr) {
        if (addr.substring(0, 2) == "0x") {
            this.address = addr.substring(2);
        }
        else {
            this.address = addr;
        }
    }
    toU256Bytes() {
        return new bn_js_1.default(this.address, 16, "be").toBuffer("be", 32).toString("hex");
    }
}
exports.Address = Address;
class TxWithdraw {
    constructor(tokenIndex, amount, l1address, networkId) {
        let addressBN = new bn_js_1.default(l1address.address, 16);
        this.tokenIndex = tokenIndex;
        this.amount = amount;
        this.l1address = addressBN;
        this.opcode = new bn_js_1.default(1);
    }
    toBinary(endian) {
        let bytes = [
            this.opcode.toBuffer(endian, 1),
            this.tokenIndex.toBuffer(endian, 1),
            new bn_js_1.default(0).toBuffer(endian, 2), // reserved 0
            this.l1address.toBuffer(endian, 20), // address is always be
            this.amount.toBuffer(endian, 8),
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
        let data = this.transactions.map((x) => x.toBinary("be")).join("");
        const hvalue = (0, sha256_1.default)(enc_hex_1.default.parse(data)).toString();
        const shalow = new bn_js_1.default(hvalue.slice(0, 32), "hex", "be");
        const shahigh = new bn_js_1.default(hvalue.slice(32, 64), "hex", "be");
        this.shaLow = shalow;
        this.shaHigh = shahigh;
    }
    getVerifierInputs() {
        // Split oldroot into 4 parts
        let oldrootStr = this.oldroot.toString(16);
        let oldroot1 = new bn_js_1.default(oldrootStr.slice(0, 16), "hex", "be");
        let oldroot2 = new bn_js_1.default(oldrootStr.slice(16, 32), "hex", "be");
        let oldroot3 = new bn_js_1.default(oldrootStr.slice(32, 48), "hex", "be");
        let oldroot4 = new bn_js_1.default(oldrootStr.slice(48, 64), "hex", "be");
        // Split newroot into 4 parts
        let newrootStr = this.newroot.toString(16);
        let newroot1 = new bn_js_1.default(newrootStr.slice(0, 16), "hex", "be");
        let newroot2 = new bn_js_1.default(newrootStr.slice(16, 32), "hex", "be");
        let newroot3 = new bn_js_1.default(newrootStr.slice(32, 48), "hex", "be");
        let newroot4 = new bn_js_1.default(newrootStr.slice(48, 64), "hex", "be");
        // Split shaLow into 2 parts
        let shalowStr = this.shaLow.toString(16);
        let shalow1 = new bn_js_1.default(shalowStr.slice(0, 16), "hex", "be");
        let shalow2 = new bn_js_1.default(shalowStr.slice(16, 32), "hex", "be");
        // Split shaHigh into 2 parts
        let shahighStr = this.shaHigh.toString(16);
        let shahigh1 = new bn_js_1.default(shahighStr.slice(0, 16), "hex", "be");
        let shahigh2 = new bn_js_1.default(shahighStr.slice(16, 32), "hex", "be");
        return [
            oldroot1, oldroot2, oldroot3, oldroot4,
            newroot1, newroot2, newroot3, newroot4,
            shalow1, shalow2, shahigh1, shahigh2
        ];
    }
    getTxData() {
        let data = this.transactions.map((x) => x.toBinary("be")).join("");
        console.log("data", data);
        console.assert(data.length == 160);
        return data;
        /*
        let u64inputs = [];
        for(var i=0; i<data.length/16; i++) {
            u64inputs.push(data.slice(i*16,(i+1)*16));
        }
        return u64inputs;
        */
    }
    async verify(proxy, proof, batchinstance, aux, rid) {
        console.log("wasminputs", this.getTxData());
        console.log("verifierinputs", this.getVerifierInputs());
        return proxy.verify("0x" + this.getTxData(), [proof.toString()], [batchinstance.toString()], [aux.toString()], [this.getVerifierInputs().map((x) => x.toString())]);
    }
}
exports.TxData = TxData;
