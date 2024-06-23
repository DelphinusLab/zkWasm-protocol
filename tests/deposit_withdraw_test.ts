import BN from "bn.js";
import { TxData, Tx, TxDeposit, TxWithdraw, Address } from "../src/index";
import { withL1ServerClient, L1ServerClient } from "../src/clients/client";
import { getConfigByChainName } from "zkwasm-deployment/src/config";
import { L1ClientRole } from "zkwasm-deployment/src/types";
import { test_verify } from "./test_utils";

const initial_root: Uint8Array = new Uint8Array([
  166, 157, 178, 62, 35, 83, 140, 56, 9, 235, 134, 184, 20, 145, 63, 43, 245,
  186, 75, 233, 43, 42, 187, 217, 104, 152, 219, 89, 125, 199, 161, 9,
]);
const withdraw_root: Uint8Array = new Uint8Array([
  146, 154, 4, 1, 65, 7, 114, 67, 209, 68, 222, 153, 65, 139, 137, 45, 124, 86,
  61, 115, 142, 90, 166, 41, 22, 133, 154, 149, 141, 76, 198, 11,
]);

const l1account = "0xD91A86B4D8551290655caCED21856eF6E532F2D4";

// use the funtion when you do not want to set hard code
async function getCurrentRoot(l1client: L1ServerClient) {
  let proxy = l1client.getProxyContract();
  let proxyInfo = await proxy.getProxyInfo();
  let currentRoot: string = proxyInfo.merkle_root.toString();
  return currentRoot;
}

async function main() {
  let testChain = process.argv[2];
  let config = await getConfigByChainName(L1ClientRole.Monitor, testChain);

  let txdeposit = new TxDeposit(
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(1) << BigInt(12), // BN(1).shln(12)
    new Address("D91A86B4D8551290655caCED21856eF6E532F2D4")
  );

  let txdatadeposit = new TxData(
    new BN(initial_root, 16, "le"),
    new BN(withdraw_root, 16, "le"),
    [txdeposit]
  );

  let networkId = parseInt(config.deviceId, 10);
  let txwithdraw = new TxWithdraw(
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(1) << BigInt(12), // BN(1).shln(12)
    new Address("D91A86B4D8551290655caCED21856eF6E532F2D4"),
    networkId
  );

  let txdatawithdraw = new TxData(
    new BN(withdraw_root, 16, "le"),
    new BN(initial_root, 16, "le"),
    [txwithdraw]
  );

  console.log(
    "--------------------------- Testing Action: Deposit ---------------------------"
  );

  async function test_deposit(l1client: L1ServerClient) {
    let tokenContract = l1client.getTokenContract();
    let proxy = l1client.getProxyContract();

    await proxy.approve_deposit(tokenContract, txdeposit, l1account);
    return test_verify(l1client, txdatadeposit, testChain, "deposit");
  }

  await withL1ServerClient(config, async (l1client: L1ServerClient) => {
    return await test_deposit(l1client);
  });

  console.log(
    "--------------------------- Testing Action: Withdraw ---------------------------"
  );

  await withL1ServerClient(config, async (l1client: L1ServerClient) => {
    return test_verify(l1client, txdatawithdraw, testChain, "withdraw");
  });
}

main().then((v) => {
  process.exit();
});
