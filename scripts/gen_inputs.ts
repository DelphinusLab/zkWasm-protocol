import BN from "bn.js";
import { TxData, Tx, TxWithdraw, Address} from "../src/index";
import { getChainId } from "hardhat";

// This is the root hash in little-endian
const initial_root: Uint8Array = new Uint8Array([166, 157, 178, 62, 35, 83, 140, 56, 9, 235, 134, 184, 20, 145, 63, 43, 245, 186, 75, 233, 43, 42, 187, 217, 104, 152, 219, 89, 125, 199, 161, 9]);
const withdraw_root: Uint8Array = new Uint8Array([146, 154, 4, 1, 65, 7, 114, 67, 209, 68, 222, 153, 65, 139, 137, 45, 124, 86, 61, 115, 142, 90, 166, 41, 22, 133, 154, 149, 141, 76, 198, 11]);

function gen_inputs(root: Uint8Array, tx: Tx, comments: string) {
  const root_hex = Buffer.from(root).toString("hex");
  //console.log(root_hex);
  let txdata = new TxData(
    new BN(root_hex, 16, "le"),
    new BN(0),
    [tx]
  );
  let inputs = txdata.getVerifierInputs();
  let publicInputsBytes = inputs.map((x) => {
    return x.toBuffer("le", 32).toString("hex")
  }).join("");
  console.log("generate zkwasm inputs:", comments);
  console.log("publicInputsBytes", publicInputsBytes);

  let privateInputsBytes = txdata.getTxData();
  console.log("privateInputsBytes", privateInputsBytes);
}

async function main() {
  let chainId = await getChainId();

  let txwithdraw = new TxWithdraw(
    new BN(0),
    new BN(1).shln(12),
    new Address("D91A86B4D8551290655caCED21856eF6E532F2D4"),
    Number(chainId)
  );

  gen_inputs(withdraw_root, txwithdraw, "withdraw");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
