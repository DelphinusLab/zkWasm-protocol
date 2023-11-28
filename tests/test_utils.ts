import BN from "bn.js";
import { TxData, TxWithdraw, Address } from "../src/index";
import { withL1ServerClient, L1ServerClient } from "../src/clients/client";
import { RidInfo } from "../src/clients/contracts/proxy";
import { getConfigByChainName } from "zkwasm-deployment/src/config";
import { L1ClientRole } from "zkwasm-deployment/src/types";
import { encodeL1address, toHexStr } from "web3subscriber/src/addresses";
import { TxBinder } from "web3subscriber/src/txbinder";
import {
  DelphinusReadOnlyConnector,
  GetBaseProvider,
} from "web3subscriber/src/provider";
/*
import { RidInfo } from "../src/clients/contracts/proxy";
*/

async function getEvent(
  action: string,
  blockNumber: number,
  testChain: string
) {
  let config = await getConfigByChainName(L1ClientRole.Monitor, testChain);
  let readOnlyProvider = new DelphinusReadOnlyConnector(config.rpcSource);

  let ProxyJSON = require("../../build/contracts/Proxy.json");
  let contract = readOnlyProvider.getContractWithoutSigner(
    ProxyJSON.networks[config.deviceId].address,
    ProxyJSON
  );
  // TODO: dont use parseint

  let pastEvents = await contract.getPastEventsFrom(blockNumber);
  for (let r of pastEvents) {
    console.log(
      "--------------------- Get L1 Event: %s ---------------------",
      r.transactionHash
    );
    // TODO: Fix event information
    console.log("blockNumber:", r.blockNumber);
    console.log("blockHash:", r.blockHash);
    console.log("transactionHash:", r.transactionHash);
    // TODO: Fix event information
    // if (r.returnValues.l2account == "1") {
    //   if (action != "withdraw") {
    //     console.log(
    //       "SideEffect Check Failed: Action" +
    //         action +
    //         "should not call SideEffect!"
    //     );
    //   } else {
    //     console.log("SideEffect Check: Passed");
    //   }
    // } else {
    //   if (action == "withdraw") {
    //     console.log(
    //       "SideEffect Check Failed: Action" + action + "should call SideEffect!"
    //     );
    //   } else {
    //     console.log("SideEffect Check: Passed");
    //   }
    // }
  }
}

// TODO add proof, batchinstance, aux parameters
export async function test_verify(
  l1client: L1ServerClient,
  txdata: TxData,
  testChain: string,
  action: string
) {
  console.log("testing verify ...");
  console.log("start to send to:", l1client.getChainIdHex());
  while (true) {
    let txhash = "";
    try {
      let proxy = l1client.getProxyContract();
      let proxyInfo = await proxy.getProxyInfo();
      console.log("onchain merkle_root", proxyInfo.merkle_root.toString());
      console.assert(proxyInfo.merkle_root == txdata.oldroot);
      let ridInfo: RidInfo = {
        rid: new BN(proxyInfo.rid),
        batch_size: new BN("1"),
      };
      let tx = txdata.verify(
        l1client,
        [BigInt(0)], // proof
        [BigInt(0)], // batchinstance
        [BigInt(0)], // aux
        ridInfo
      );
      tx.when("Verify", "transactionHash", (txResponse) => {
        console.log("Get transactionHash", txResponse);
        txhash = txResponse?.hash!;
      });

      tx.when("Verify", "transactionReceipt", async (receipt) => {
        if (!receipt) return;
        console.log("done", receipt.blockHash);
        console.log("Send Transaction Successfully: Passed");
        let e = await getEvent(action, receipt.blockNumber, testChain);
        console.log(e);
        console.log("Get AckEvent successfully: Passed");
      });
      await tx.execute("Verify");
    } catch (e: any) {
      if (txhash !== "") {
        console.log("exception with transactionHash ready", " will retry ...");
        throw e;
      } else {
        if (e.message == "ESOCKETTIMEDOUT") {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } else if (e.message == "nonce too low") {
          console.log("failed on:", l1client.getChainIdHex(), e.message); // not sure
          return;
        } else {
          console.log("Unhandled exception during verify");
          console.log(e);
          throw e;
        }
      }
    }
  }
}
/*
 *
async function verify(
  l1client: L1Client,
  command: string,
  sha_low: BN,
  sha_high: BN,
  totalAmount: BN,
  testChain: string,
) {
  console.log("start to send to:", l1client.getChainIdHex());
  while (true) {
    let txhash = "";
    try {
      let proxy = l1client.getProxyContract();
      let tokenContract = l1client.getTokenContract();
      let config = await getConfigByChainName(L1ClientRole.Monitor, testChain);
      let balanceOfMonitor = await tokenContract.balanceOf(config.monitorAccount);
      console.log("Monitor Account Before",balanceOfMonitor.toString(10));
      let ProxyJSON = require("../../build/contracts/Proxy.json");
      let balanceOfContract = await tokenContract.balanceOf(ProxyJSON.networks[config.deviceId].address);
      console.log("Contract Account Before",balanceOfContract.toString(10));
      let currentRid = new BN(0);
      let currentMerkleRoot = "";
      await proxy.getProxyInfo().then((Proxyinfo:any)=>{
        currentRid = Proxyinfo.rid;
        currentMerkleRoot = Proxyinfo.merkle_root.toString();
      });
      let ridInfo: RidInfo = {rid: new BN(currentRid), batch_size: new BN(1)};
      let tx = proxy.verify(command,[new BN("0")],[new BN("0")],[new BN("0")],[[currentMerkleRoot, currentMerkleRoot, sha_low.toString(), sha_high.toString()]], ridInfo);
      let r = await tx.when("Verify", "transactionHash", (hash: string) => {
        console.log("Get transactionHash", hash);
        txhash = hash;
      });
      console.log("done", r.blockHash);
      let balanceOfMonitorAfter = await tokenContract.balanceOf(config.monitorAccount);
      console.log("Monitor Account After",balanceOfMonitorAfter.toString(10));
      let balanceOfContractAfter = await tokenContract.balanceOf(ProxyJSON.networks[config.deviceId].address);
      console.log("Contract Account After",balanceOfContractAfter.toString(10));
      if(balanceOfMonitor.toString(10) == balanceOfMonitorAfter.sub(totalAmount).toString(10)){
        console.log("Monitor Balance Check: PASSED")
      }else{
        console.log("Monitor Balance Check: FAILED")
      }
      if(balanceOfContractAfter.toString(10) == balanceOfContract.sub(totalAmount).toString(10)){
        console.log("Contract Balance Check: PASSED")
      }else{
        console.log("Contract Balance Check: FAILED")
      }
      return r;
    } catch (e: any) {
      if (txhash !== "") {
        console.log("exception with transactionHash ready", " will retry ...");
        console.log("exception with transactionHash ready", " will retry ...");
        throw e;
      } else {
        if (e.message == "ESOCKETTIMEDOUT") {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } else if (e.message == "nonce too low") {
          console.log("failed on:", l1client.getChainIdHex(), e.message); // not sure
          return;
        } else {
          console.log("Unhandled exception during verify");
          console.log(e);
          throw e;
        }
      }
    }
  }
}
*/

export async function mintToken(testChain: string) {
  let config = await getConfigByChainName(L1ClientRole.Monitor, testChain);
  let account = config.monitorAccount;
  let txbinder = new TxBinder();

  await withL1ServerClient(config, async (l1client: L1ServerClient) => {
    let token = l1client.getTokenContract();
    let balance = await token.balanceOf(account);
    if (balance.cmp(new BN("10000000000000000")) == -1) {
      console.log(
        "Monitor Account's balance before mint:",
        balance.toString(10)
      );
      await txbinder.execute("mint", () =>
        token.mint(BigInt("10000000000000000"))
      );
      balance = await token.balanceOf(account);
      console.log("Monitor Account's balance:", balance.toString(10));
    } else {
      console.log("Monitor Account's balance:", balance.toString(10));
      console.log(
        "Monitor Account Have Enough Test Token To DO DEPOSIT & WITHDRAW TEST, SKIPED MINT"
      );
    }
  });
}

export async function addToken(testChain: string) {
  let config = await getConfigByChainName(L1ClientRole.Monitor, testChain);
  let tokenIndex = 0;
  try {
    await withL1ServerClient(config, async (l1client: L1ServerClient) => {
      let proxy = l1client.getProxyContract();
      let token = l1client.getTokenContract();
      let existing_tokens = await proxy.allTokens();
      let tokenUid = encodeL1address(
        (await token.getEthersContract().getAddress()).replace("0x", ""),
        parseInt(config.deviceId).toString(16)
      );
      let checkExistToken = 0;
      for (let i = 0; i < existing_tokens.length; i++) {
        if (existing_tokens[i].token_uid == tokenUid.toString()) {
          console.log("Test Token:" + tokenUid + "Exist");
          tokenIndex = i;
          console.log("Token Index is:", tokenIndex);
          checkExistToken = 1;
        }
      }

      if (checkExistToken == 0) {
        console.log(`Adding test token uid: ${tokenUid.toString(16)}`);

        let tx = await proxy.addToken(BigInt(tokenUid.toString(16)));
        console.log("Token Index is:", tokenIndex);
      }
    });
  } catch (err) {
    console.log("%s", err);
  }
  return tokenIndex;
}

/*

async function deposit(l1client: L1Client, depositAmount: BN, testChain: string) {
    let proxy = l1client.getProxyContract();
    let tokenContract = l1client.getTokenContract();
    let config = await getConfigByChainName(L1ClientRole.Monitor, testChain);
    let balanceOfMonitor = await tokenContract.balanceOf(config.monitorAccount);
    let ProxyJSON = require("../../build/contracts/Proxy.json");
    let balanceOfContract = await tokenContract.balanceOf(ProxyJSON.networks[config.deviceId].address);
    await proxy.deposit(tokenContract, depositAmount, config.monitorAccount,"0");
    let balanceOfMonitorAfter = await tokenContract.balanceOf(config.monitorAccount);
    let balanceOfContractAfter = await tokenContract.balanceOf(ProxyJSON.networks[config.deviceId].address);
    if(balanceOfMonitor.toString(10) == balanceOfMonitorAfter.add(depositAmount).toString(10)){
      console.log("Monitor Balance Check: PASSED")
    }else{
      console.log("Monitor Balance Check: FAILED")
    }
    if(balanceOfContractAfter.toString(10) == balanceOfContract.add(depositAmount).toString(10)){
      console.log("Contract Balance Check: PASSED")
    }else{
      console.log("Contract Balance Check: FAILED")
    }
}
*/
