import {
  getChargeAddress,
  dataToBN,
  L1Client,
  withL1Client
} from "./clients/client.js";

import {
  ProxyInfo,
  TokenInfo,
  Deposit,
  SwapAck,
  WithDraw,
  RidInfo,
  ProxyContract
} from "./clients/contracts/proxy.js";

import { contractsInfo } from "./clients/config-contracts-info.js";
import { GasContract } from "./clients/contracts/gas.js";
import { TokenContract } from "./clients/contracts/token.js";
import BN from "bn.js";
import sha256 from "crypto-js/sha256";
import hexEnc from "crypto-js/enc-hex";

export interface Tx {
    toBinary: (endian: BN.Endianness) => string;
}

export class TxWithdraw {
  nonce: BN;
  accountIndex: BN;
  tokenIndex: BN;
  amount: BN;
  l1address: BN;
  opcode: BN;

  constructor(nonce:BN, accountIndex:BN, tokenIndex:BN, amount:BN, l1address:BN) {
    this.nonce = nonce;
    this.accountIndex = accountIndex;
    this.tokenIndex = tokenIndex;
    this.amount = amount;
    this.l1address = l1address;
    this.opcode = new BN(1);
  }

  toBinary(endian: BN.Endianness) {
    let bytes = [
      this.opcode.toBuffer(endian, 1),
      this.nonce.toBuffer(endian, 7),
      this.accountIndex.toBuffer(endian, 4),
      this.tokenIndex.toBuffer(endian, 4),
      this.amount.toBuffer(endian, 32),
      this.l1address.toBuffer(endian, 32),
    ]
    .map((x) => {
        return x.toString("hex");
    })
    .join("");
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
    return [this.oldroot, this.newroot, this.shaLow, this.shaHigh];
  }

  getZkwasmInputs(): Array<string> {
    let data = this.transactions.map((x) => x.toBinary("be")).join("");
    console.assert(data.length == 160);
    let u64inputs = [];
    for(var i=0; i<data.length/16; i++) {
        u64inputs.push(data.slice(i*16,(i+1)*16));
    }
    return u64inputs;
  }
}

export {
  getChargeAddress,
  dataToBN,
  L1Client,
  withL1Client,
  ProxyContract,
  contractsInfo,
  GasContract,
  TokenContract
};

export type {
  ProxyInfo,
  TokenInfo,
  Deposit,
  SwapAck,
  WithDraw,
  RidInfo
}
