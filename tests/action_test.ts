import BN from "bn.js";
import sha256 from "crypto-js/sha256";
import hexEnc from "crypto-js/enc-hex";
import { Field } from "delphinus-curves/src/field";
import { withL1Client, L1Client } from "../clients/client";
import { getConfigByChainName } from "delphinus-deployment/src/config";
import { L1ClientRole } from "delphinus-deployment/src/types";
import { Web3ProviderMode } from "web3subscriber/src/client";
import { DelphinusHttpProvider } from "web3subscriber/src/provider";
import { exit } from "process";

async function getEvent(action: string, blockNumber: string, testChain: string){
  let config = await getConfigByChainName(L1ClientRole.Monitor, testChain)
  let providerConfig = {
      provider: new DelphinusHttpProvider(config.rpcSource),
      monitorAccount: config.monitorAccount,
  };
  let web3 = new Web3ProviderMode(providerConfig);
  let ProxyJSON = require("../../build/contracts/Proxy.json");
  let contract = web3.getContract(ProxyJSON, ProxyJSON.networks[config.deviceId].address, config.monitorAccount);
  let pastEvents = await contract.getWeb3Contract().getPastEvents("allEvents", {
      filter: { blockNumber: blockNumber },
      fromBlock: blockNumber,
  })
  for(let r of pastEvents){
      console.log(
      "--------------------- Get L1 Event: %s ---------------------",
      r.event
      );
      console.log("blockNumber:", r.blockNumber);
      console.log("blockHash:", r.blockHash);
      console.log("transactionHash:", r.transactionHash);
      if(r.returnValues.l2account == "1"){
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

async function verify(
  l1client: L1Client,
  command: number[],
  sha_low: BN,
  sha_high: BN,
  testChain: string,
  action:  string,
  vid: number = 0
) {
  console.log("start to send to:", l1client.getChainIdHex());
  while (true) {
    let txhash = "";
    try {
      let proxy = l1client.getProxyContract();
      let currentRid = new BN(0);
      let currentMerkleRoot = "";
      let newToken = new BN(0);
      await proxy.getProxyInfo().then((Proxyinfo:any)=>{
        currentRid = Proxyinfo.rid;
        currentMerkleRoot = Proxyinfo.merkle_root.toString();
        newToken = new BN(Proxyinfo.amount_token + 1);
      });
      await proxy.addToken(newToken);
      let tx = proxy.verify(command,[new BN("0")],[new BN("0")],[new BN("0")],[[currentMerkleRoot, currentMerkleRoot, sha_low.toString(), sha_high.toString()]], vid, new BN(currentRid));
      let r = await tx.when("Verify", "transactionHash", (hash: string) => {
        console.log("Get transactionHash", hash);
        txhash = hash;
      });
      console.log("done", r.blockHash);
      console.log("Send Transaction Successfully: Passed");
      await getEvent(action, r.blockNumber, testChain);
      console.log("Get AckEvent successfully: Passed");
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

async function main(action: string) {
  let pendingEvents: [Field, Field[]][] = [];
  if(action == "addpool"){
    let nonce = 0;
    let tokenIndex0 = 0;
    let tokenIndex1 = 1;
    let poolIndex = 0;
    let callerAccountIndex = 0;
    for (let i=0; i<10; i++){
      pendingEvents.push(
      [
          new Field(5), 
          [
          new Field(0), 
          new Field(0),
          new Field(0), 
          new Field(nonce+i), 
          new Field(tokenIndex0+i), 
          new Field(tokenIndex1+i), 
          new Field(0), 
          new Field(0), 
          new Field(poolIndex+i),
          new Field(callerAccountIndex+i)
          ]
      ]);
    }
  }else if(action == "deposit"){
    let nonce = 0;
    let accountIndex = 0;
    let tokenIndex = 0;
    let amount = 1;
    let l1_tx_hash = 0;
    let callerAccountIndex = 0;
    for (let i=0; i<10; i++){
      pendingEvents.push(
      [
          new Field(0), 
          [
          new Field(0), 
          new Field(0),
          new Field(0), 
          new Field(nonce+i), 
          new Field(accountIndex+i), 
          new Field(tokenIndex+i), 
          new Field(amount+i), 
          new Field(l1_tx_hash+i), 
          new Field(callerAccountIndex+i),
          new Field(0)
          ]
      ]);
    }
  }else if (action == "retrive"){
    let nonce = 0;
    let accountIndex = 0;
    let poolIndex = 0;
    let amount0 = 0;
    let amount1 = 0;
    for (let i=0; i<10; i++){
      pendingEvents.push(
      [
          new Field(3),
          [
          new Field(0), 
          new Field(0), 
          new Field(0), 
          new Field(nonce+i),
          new Field(accountIndex+i),
          new Field(poolIndex+i),
          new Field(amount0+i),
          new Field(amount1+i),
          new Field(0),
          new Field(0)
          ]
      ]);
    }
  }else if (action == "setkey"){
    let nonce = 0;
    let accountIndex = 0;
    for (let i=0; i<10; i++){
      pendingEvents.push(
      [
          new Field(6),
          [
          new Field(0),
          new Field(0),
          new Field(0),
          new Field(nonce+i),
          new Field(accountIndex+i),
          new Field(0),
          new Field(0),
          new Field(0),
          new Field(0),
          new Field(0)
          ]
      ]);
    }
  }else if (action == "supply"){
    let nonce = 0;
    let accountIndex = 0;
    let poolIndex = 0;
    let amount0 = 1;
    let amount1 = 1;
    for (let i=0; i<10; i++){
      pendingEvents.push(
      [
          new Field(4),
          [
          new Field(0),
          new Field(0),
          new Field(0),
          new Field(nonce+i),
          new Field(accountIndex+i),
          new Field(poolIndex+i),
          new Field(amount0+i),
          new Field(amount1+i),
          new Field(0),
          new Field(0)
          ]
      ]);
    }
  }else if (action == "swap"){
    let nonce = 0;
    let accountIndex = 0;
    let poolIndex = 0;
    let reverse = 0;
    let amount = 0;
    for (let i=0; i<10; i++){
      pendingEvents.push(
      [
          new Field(2),
          [
          new Field(0),
          new Field(0),
          new Field(0),
          new Field(nonce+i),
          new Field(accountIndex+i),
          new Field(poolIndex+i),
          new Field(reverse),
          new Field(amount+i),
          new Field(0),
          new Field(0)
          ]
      ]);
    }
  }else if (action == "withdraw"){
    let nonce = 0;
    let accountIndex = 0;
    let tokenIndex = 0;
    let amount = 0;
    let l1address = 0;
    for (let i=0; i<10; i++){
      pendingEvents.push(
      [
          new Field(1),
          [
          new Field(0),
          new Field(0),
          new Field(0),
          new Field(nonce+i),
          new Field(accountIndex+i),
          new Field(tokenIndex),
          new Field(amount+i),
          new Field(l1address+i),
          new Field(0),
          new Field(0)
          ]
      ]);
    }
  }else{
    console.log("No Action Match")
    return
  }
  const data = pendingEvents
  .map((command) =>
    [
      command[0].v.toBuffer("be", 1),
      command[1][3].v.toBuffer("be", 8),
      command[1][4].v.toBuffer("be", 4),
      command[1][5].v.toBuffer("be", 4),
      command[1][6].v.toBuffer("be", 32),
      command[1][7].v.toBuffer("be", 32),
    ]
      .map((x) => {
        return x.toString("hex");
      })
      .join("")
  )
  .join("");
  const hvalue = sha256(hexEnc.parse(data)).toString();
  const sha_low = new BN(hvalue.slice(0, 32), "hex", "be");
  const sha_high = new BN(hvalue.slice(32, 64), "hex", "be");


  const commandBuffer = pendingEvents.map(
      e => [
        e[0].v.toArray('be', 1),
        e[1][3].v.toArray('be', 8),
        e[1][4].v.toArray('be', 4),
        e[1][5].v.toArray('be', 4),
        e[1][6].v.toArray('be', 32),
        e[1][7].v.toArray('be', 32)
      ]).flat(2);

  let testChain = process.argv[3]
  let config = await getConfigByChainName(L1ClientRole.Monitor, testChain)
  console.log(
    "============================== Testing Action: %s ==============================",
    action
    );
  await withL1Client(config, false, (l1client: L1Client) => {
    return verify(
      l1client,
      commandBuffer,
      sha_low,
      sha_high,
      config.chainName,
      action
    );
  });
}

main(process.argv[2]).then(v => {process.exit();})