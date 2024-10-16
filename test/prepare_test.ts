import { mintToken, addToken } from "./test_utils";

export async function prepare_test() {
    await mintToken();
    await addToken();
}
