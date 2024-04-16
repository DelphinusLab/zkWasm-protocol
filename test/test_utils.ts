import BN from "bn.js";
import { ethers } from "hardhat";
import { Log, LogDescription } from "ethers";
import { TxBinder } from "web3subscriber/src/txbinder";
import { encodeL1address } from "web3subscriber/src/addresses";
import { RidInfo } from "../src/clients/contracts/proxy";
import { TxData } from "../src/index";
import { deployContract } from "../src/clients/client";

async function getEvent(action: string, blockNumber: bigint) {
  const { proxy } = await deployContract();

  // The queryFilter returns Promise<(Log | EventLog)[]> and
  // the EventLog inherites from Log. So, we can use Log[].
  // Get all events with "*"
  let pastEvents: Log[] = await proxy.queryFilter("*", blockNumber);

  for(let r of pastEvents){
    let eventName = proxy.interface.getEventName(r.topics[0]);

    // parseLog returns LogDescript because the log(r) in the for loop
    // must match an event
    let parsedLog: LogDescription = proxy.interface.parseLog(r) as LogDescription;

    // Get the arguments passed into the Event with emit.
    let args = parsedLog.args;

    console.log(
      "--------------------- Get L1 Event: %s ---------------------",
      eventName
    );
    console.log("blockNumber:", r.blockNumber);
    console.log("blockHash:", r.blockHash);
    console.log("transactionHash:", r.transactionHash);
    if(args.l2account == BigInt(1)){
      if(action != "withdraw"){
        console.log("SideEffect Check Failed: Action" + action + "should not call SideEffect!");
      }else{
        console.log("SideEffect Check: Passed");
      }
    }else{
      if(action == "withdraw"){
        console.log("SideEffect Check Failed: Action" + action + "should call SideEffect!");
      }else{
        console.log("SideEffect Check: Passed");
      }
    }
  }
}

// TODO add proof, batchinstance, aux parameters
export async function test_verify(
  txdata: TxData,
  action: string,
) {
  const { proxy, chainId } = await deployContract();
  let txbinder = new TxBinder();

  console.log("testing verify ...");
  console.log("start to send to:", "0x" + chainId!.toString(16));
  while (true) {
    let txresponse = null;
    try {
      let proxyInfo = await proxy.getProxyInfo();
      console.log("onchain merkle_root", proxyInfo.merkle_root.toString());
      console.assert(proxyInfo.merkle_root == txdata.oldroot);
      let ridInfo: RidInfo = {
        rid: new BN(proxyInfo.rid),
        batch_size: new BN("1")
      };

      // Bind some callbacks to the Verify action
      txbinder
        .when("Verify", "transactionHash", (txResponse) => {
          console.log("Get transactionHash", txResponse);
          txresponse = txResponse;
        });

      // Bind the transaction method to an action name
      let r = await txbinder.execute("Verify", () => {
        // Execute some transaction which returns a TransactionResponse
        return txdata.verify(
          [new BN("0")], // proof
          [new BN("0")], // batchinstance
          [new BN("0")], // aux
          ridInfo
        );
      });

      console.log("done", txresponse!.hash);
      console.log("Send Transaction Successfully: Passed");
      let e = await getEvent(action, txresponse!.blockNumber);
      console.log(e);
      console.log("Get AckEvent successfully: Passed");
      return r;
    } catch (e: any) {
      if (txresponse !== "") {
        console.log("exception with transactionHash ready", " will retry ...");
        console.log("exception with transactionHash ready", " will retry ...");
        throw e;
      } else {
        if (e.message == "ESOCKETTIMEDOUT") {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } else if (e.message == "nonce too low") {
          console.log("failed on:", "0x" + chainId!.toString(16), e.message); // not sure
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

export async function mintToken() {
  const { token, tokenAddress, owner } = await deployContract();
  let txbinder = new TxBinder();

  try {
    // Bind a callback to the snapshot event
    txbinder.register_snapshot("Mint", () => {
      console.log("Mint snapshot");
    });

    // Bind some callbacks to the mint action
    txbinder
      .when("mint", "transactionHash", (txResponse) => {
        console.log("transactionHash", txResponse);
      });

    // Bind the transaction method to an action name
    await txbinder.bind("mint", () => {
      // Execute some transaction which returns a TransactionResponse
      return token.mint(BigInt("10000000000000000"));
    });

    // call the callback when the snapshot event is emitted
    txbinder.snapshot("Mint");

    console.log("mint token:", tokenAddress);
    let balance = await token.balanceOf(owner.address);

    if(balance < BigInt("10000000000000000")) {
      console.log("Monitor Account's balance before mint:", balance.toString(10));

      // Execute the transaction method and handle the transactionHash callback
      await txbinder.execute("mint");

      balance = await token.balanceOf(owner.address);
      console.log("Monitor Account's balance:", balance.toString(10));
    }else{
      console.log("Monitor Account's balance:", balance.toString(10));
      console.log("Monitor Account Have Enough Test Token To DO DEPOSIT & WITHDRAW TEST, SKIPED MINT");
    }
  } catch (err) {
    console.log("%s", err);
  }
}

export async function addToken () {
  const { proxy, chainId, tokenAddress } = await deployContract();
  let tokenIndex = 0;

  try {
    let existing_tokens = await proxy.allTokens();
    let tokenUid = encodeL1address(tokenAddress.replace("0x", ""), chainId!.toString(16));
    let tokenUidString = tokenUid.toString(16);
    let checkExistToken = 0;

    for(let i = 0; i < existing_tokens.length; i++){
      if(existing_tokens[i].token_uid.toString() == tokenUidString){
          console.log("Test Token:" + tokenUid + "Exist");
          tokenIndex = i;
          console.log("Token Index is:", tokenIndex);
          checkExistToken = 1;
      }
    }

    if(checkExistToken == 0){
      console.log(`Adding test token uid: ${tokenUidString}`);
      await proxy.addToken(ethers.toBigInt("0x" + tokenUidString));
      console.log("Token Index is:", tokenIndex);
    }
  } catch (err) {
    console.log("%s", err);
  }
  return tokenIndex;
};

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
