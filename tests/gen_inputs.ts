import BN from "bn.js";
import { TxData, TxWithdraw} from "../src/index";

function main() {
    let txwithdraw = new TxWithdraw(
            new BN(0),
            new BN(0),
            new BN(0),
            new BN(1).shln(12),
            new BN("D91A86B4D8551290655caCED21856eF6E532F2D4", 16)
    );
    let txdata = new TxData(
            new BN(0),
            new BN(0),
            [txwithdraw]
    );
    let inputs = txdata.get_verifier_inputs();
    let publicInputsBytes = inputs.map((x) => {
        return x.toBuffer("le", 32).toString("hex")
    }).join("");
    console.log(publicInputsBytes);

    let privateInputsBytes = txdata.get_zkwasm_inputs().join("");
    console.log(privateInputsBytes);
}

main();
