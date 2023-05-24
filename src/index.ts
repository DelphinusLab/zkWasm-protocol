import BN from "bn.js";
import sha256 from "crypto-js/sha256";
import hexEnc from "crypto-js/enc-hex";

interface Tx {
  to_binary: () => string;
}

class TxWithdraw {
  nonce: BN;
  accountIndex: BN;
  tokenIndex: BN;
  amount: BN;
  l1address: BN;
  opcode: BN;

  constructor(nonce:BN, accountIndex:BN, tokenIndex:BN, amount:BN, l1address:BN, opcode:BN) {
    this.nonce = nonce;
    this.accountIndex = accountIndex;
    this.tokenIndex = tokenIndex;
    this.amount = amount;
    this.l1address = l1address;
    this.opcode = new BN(1);
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

class TxData {
  oldroot: BN;
  newroot: BN;
  sha256: BN;
  transactions: Array<Tx>;

  constructor(o: BN, n: BN, s:BN) {
    this.oldroot = o;
    this.newroot = n;
    this.sha256 = s;
    this.transactions = []; 
  } 

  get_verifier_inputs(): Array<BN> {
    let data = this.transactions.map((x) => x.to_binary()).join("");
    const hvalue = sha256(hexEnc.parse(data)).toString();
    const sha_low = new BN(hvalue.slice(0, 32), "hex", "be");
    const sha_high = new BN(hvalue.slice(32, 64), "hex", "be");
    return [this.oldroot, this.newroot, sha_low, sha_high];
  }
}

export default function() {
    return {};
}


