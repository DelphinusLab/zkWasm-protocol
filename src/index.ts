import BN from "bn.js";
import sha256 from "crypto-js/sha256";
import hexEnc from "crypto-js/enc-hex";
import { encodeL1address } from "web3subscriber/src/addresses";
import { RidInfo } from "./clients/contracts/proxy";
import { Proxy } from "../typechain-types";

export interface Tx {
  toBinary: (endian: BN.Endianness) => string;
}

export class Address {
  address: string;
  constructor(addr: string) {
    if(addr.substring(0, 2) == "0x") {
      this.address = addr.substring(2);
    } else {
      this.address = addr;
    }
  }
  toU256Bytes() {
      return new BN(this.address, 16, "be").toBuffer("be",32).toString("hex");
  }
}

export class TxWithdraw {
  nonce: BN;
  accountIndex: BN;
  tokenIndex: BN;
  amount: BN;
  opcode: BN;
  l1address: Address;

  constructor(nonce:BN, accountIndex:BN, tokenIndex:BN, amount:BN, l1address: Address, networkId: number) {
    this.nonce = nonce;
    this.accountIndex = accountIndex;
    this.tokenIndex = tokenIndex;
    this.amount = amount;
    this.l1address = new Address(encodeL1address(l1address.address, networkId.toString(16)).toString(16));
    this.opcode = new BN(1);
  }

  toBinary(endian: BN.Endianness) {
    let bytes = [
      this.opcode.toBuffer(endian, 1),
      this.nonce.toBuffer(endian, 7),
      this.accountIndex.toBuffer(endian, 4),
      this.tokenIndex.toBuffer(endian, 4),
      this.amount.toBuffer(endian, 32),
    ]
    .map((x) => {
        return x.toString("hex");
    })
    .join("") + this.l1address.toU256Bytes();
    return bytes;
  }
}

export class TxData {
  oldroot: BN;
  newroot: BN;
  shaLow: BN;
  shaHigh: BN;
  transactions: Array<Tx>;

  constructor(o: BN, n: BN, txs: Array<Tx>) {
    this.oldroot = o;
    this.newroot = n;
    this.transactions = txs;
    let data = this.transactions.map((x) => x.toBinary("be")).join("");
    const hvalue = sha256(hexEnc.parse(data)).toString();
    const shalow = new BN(hvalue.slice(0, 32), "hex", "be");
    const shahigh = new BN(hvalue.slice(32, 64), "hex", "be");
    this.shaLow = shalow;
    this.shaHigh = shahigh;
  }

  getVerifierInputs(): Array<BN> {
    // Split oldroot into 4 parts
    let oldrootStr = this.oldroot.toString(16);
    let oldroot1 = new BN(oldrootStr.slice(0, 16), "hex", "be");
    let oldroot2 = new BN(oldrootStr.slice(16, 32), "hex", "be");
    let oldroot3 = new BN(oldrootStr.slice(32, 48), "hex", "be");
    let oldroot4 = new BN(oldrootStr.slice(48, 64), "hex", "be");

    // Split newroot into 4 parts
    let newrootStr = this.newroot.toString(16);
    let newroot1 = new BN(newrootStr.slice(0, 16), "hex", "be");
    let newroot2 = new BN(newrootStr.slice(16, 32), "hex", "be");
    let newroot3 = new BN(newrootStr.slice(32, 48), "hex", "be");
    let newroot4 = new BN(newrootStr.slice(48, 64), "hex", "be");

    // Split shaLow into 2 parts
    let shalowStr = this.shaLow.toString(16);
    let shalow1 = new BN(shalowStr.slice(0, 16), "hex", "be");
    let shalow2 = new BN(shalowStr.slice(16, 32), "hex", "be");

    // Split shaHigh into 2 parts
    let shahighStr = this.shaHigh.toString(16);
    let shahigh1 = new BN(shahighStr.slice(0, 16), "hex", "be");
    let shahigh2 = new BN(shahighStr.slice(16, 32), "hex", "be");

    return [
      oldroot1, oldroot2, oldroot3, oldroot4,
      newroot1, newroot2, newroot3, newroot4,
      shalow1, shalow2, shahigh1, shahigh2
    ];
  }

  getTxData(): string {
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

  async verify(proxy: Proxy, proof: BN[], batchinstance: BN[], aux: BN[], rid: RidInfo) {
    console.log("wasminputs", this.getTxData());
    console.log("verifierinputs", this.getVerifierInputs());
    return proxy.verify(
      "0x" + this.getTxData(),
      [proof.toString()],
      [batchinstance.toString()],
      [aux.toString()],
      [this.getVerifierInputs().map((x) => x.toString())], // BN format in dec
      //[this.getZkwasmInstances()],
      {
        rid: rid.rid.toString(),
        batch_size: rid.batch_size.toString()
      }
    )
  }
}
