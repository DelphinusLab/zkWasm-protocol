import { withL1ServerClient, L1ServerClient } from "../../src/clients/client";
import { getConfigByChainName } from "zkwasm-deployment/src/config";
import { TxBinder } from "web3subscriber/src/txbinder";
import { L1ClientRole } from "zkwasm-deployment/src/types";

async function main(configName: string, targetAccount: string) {
  let config = await getConfigByChainName(L1ClientRole.Monitor, configName);
  let account = config.monitorAccount;
  let txbinder = new TxBinder();
  await withL1ServerClient(config, async (l1client: L1ServerClient) => {
    let token = l1client.getTokenContract();
    txbinder.when("mint", "transactionHash", (tx) => console.log(tx?.hash));
    txbinder.when("mint", "transactionReceipt", (receipt) =>
      console.log(receipt)
    );

    await txbinder.execute("mint", () => {
      return token.mint(BigInt("10000000000000000000"));
    });

    let balance = await token.balanceOf(account);

    console.log("sender: balance after mint", balance);

    if (targetAccount) {
      await txbinder.execute("transfer", () => {
        return token.transfer(targetAccount, BigInt("10000000000000000000"));
      });

      balance = await token.balanceOf(targetAccount);
      console.log("balance of recipient after transfer", balance);
    }
  });
}

/* .once("transactionHash",hash => console.log(hash) */
main(process.argv[2], process.argv[3]);
