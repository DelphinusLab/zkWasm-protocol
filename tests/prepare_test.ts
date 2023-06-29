import BN from "bn.js";
import { mintToken, addToken } from "./test_utils";

async function main(testChain: string) {
    await mintToken(testChain);
    await addToken(testChain);
}
main(process.argv[2]).then(v => {process.exit();})
