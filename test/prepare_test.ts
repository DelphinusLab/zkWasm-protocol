import { mintToken, addToken } from "./test_utils";

async function main() {
    await mintToken();
    await addToken();
}
main().then(v => {process.exit();})
