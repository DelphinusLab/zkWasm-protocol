import BN from "bn.js";
import { TxData, TxWithdraw} from "../src/index";


const initial_root: Uint8Array = new Uint8Array([166, 157, 178, 62, 35, 83, 140, 56, 9, 235, 134, 184, 20, 145, 63, 43, 245, 186, 75, 233, 43, 42, 187, 217, 104, 152, 219, 89, 125, 199, 161, 9]);


const root_hex = Buffer.from(initial_root).toString("hex");
console.log(root_hex);

function main() {
    let txwithdraw = new TxWithdraw(
            new BN(0),
            new BN(0),
            new BN(0),
            new BN(1).shln(12),
            new BN("D91A86B4D8551290655caCED21856eF6E532F2D4", 16)
    );
    let txdata = new TxData(
            new BN(root_hex, 16),
            new BN(0),
            [txwithdraw]
    );
    let inputs = txdata.getVerifierInputs();
    let publicInputsBytes = inputs.map((x) => {
        return x.toBuffer("le", 32).toString("hex")
    }).join("");
    console.log(publicInputsBytes);

    let privateInputsBytes = txdata.getZkwasmInputs().join("");
    console.log(privateInputsBytes);
}

main();
