import BN from "bn.js";
import sha256 from "crypto-js/sha256";
import hexEnc from "crypto-js/enc-hex";
import { Field } from "delphinus-curves/src/field";
import { withL1Client, L1Client } from "../clients/client";
import { getConfigByChainName } from "delphinus-deployment/src/config";
import { L1ClientRole } from "delphinus-deployment/src/types";
import { encodeL1address } from "web3subscriber/src/addresses";
import { PromiseBinder } from "web3subscriber/src/pbinder";


async function mintToken(testChain: string) {
    let config = await getConfigByChainName(L1ClientRole.Monitor, testChain);
    let account = config.monitorAccount;
    let pbinder = new PromiseBinder();
    let r = pbinder.return(async () => {
      await withL1Client(config, false, async (l1client: L1Client) => {
        let token = l1client.getTokenContract();
        try {
          pbinder.snapshot("Mint");
          console.log("mint token:", token.address());
          let balance = await token.balanceOf(account);
          if(balance < new BN(100)){
            console.log("Monitor Account's balance before mint:", balance.toString(10));
            await pbinder.bind("mint", token.mint(new BN("1000")));
            balance = await token.balanceOf(account);
            console.log("Monitor Account's balance:", balance.toString(10));
          }else{
            console.log("Monitor Account's balance:", balance.toString(10));
            console.log("Monitor Account Have Enough Test Token To DO DEPOSIT & WITHDRAW TEST, SKIPED MINT");
          }
        } catch (err) {
          console.log("%s", err);
        }
      });
    });
    await r.when(
      "mint",
      "transactionHash",
      (hash: string) => console.log(hash)
    );
  }

async function addToken(testChain: string){
    let config = await getConfigByChainName(L1ClientRole.Monitor, testChain);
    let tokenIndex = 0;
    try {
      await withL1Client(config, false, async (l1client: L1Client) => {
        let proxy = l1client.getProxyContract();
        let token = l1client.getTokenContract();
        let existing_tokens = await proxy.allTokens();
        let tokenUid = encodeL1address(token.address().replace("0x", ""), parseInt(config.deviceId).toString(16))
        let checkExistToken =0;
        for(let i=0; i < existing_tokens.length; i++){
            if(existing_tokens[i].token_uid == tokenUid.toString()){
                console.log("Test Token:" + tokenUid+ "Exist");
                tokenIndex = i
                console.log("Token Index is:", tokenIndex);
                checkExistToken = 1;
            }
        }

        if(checkExistToken == 0){
            console.log(`Adding test token uid: ${tokenUid.toString(16)}`);
            let tx = await proxy.addToken(tokenUid);
            console.log("Token Index is:", tokenIndex);
        }
      });
    } catch (err) {
      console.log("%s", err);
    }
    return tokenIndex;
}

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

async function verify(
  l1client: L1Client,
  command: number[],
  sha_low: BN,
  sha_high: BN,
  totalAmount: BN,
  testChain: string,
  vid: number = 0
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
      let tx = proxy.verify(command,[new BN("0")],[new BN("0")],[new BN("0")],[[currentMerkleRoot, currentMerkleRoot, sha_low.toString(), sha_high.toString()]], vid, new BN(currentRid));
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

async function main() {
    let testChain = process.argv[2];
    let pendingEvents: [Field, Field[]][] = [];
    console.log(
        "========================== Deposit & Withdraw Balance Check =========================="
        );
      await mintToken(testChain);
      let tokenIdx = await addToken(testChain);
    function dataToBN(data: any) {
      if (data.toHex) {
        data = data.toHex();
      }
      return new BN(data, 16);
    }
    let nonce = 0;
    let accountIndex = 0;
    let tokenIndex = tokenIdx;
    let amount = 1;
    let config = await getConfigByChainName(L1ClientRole.Monitor, testChain);
    let l1address = encodeL1address(config.monitorAccount.replace("0x", ""), parseInt(config.deviceId).toString(16));
    for (let i=0; i<10; i++){
        pendingEvents.push(
        [
            new Field(1),
            [
            new Field(0),
            new Field(0),
            new Field(0),
            new Field(dataToBN(nonce+i)),
            new Field(dataToBN(accountIndex)),
            new Field(dataToBN(tokenIndex)),
            new Field(dataToBN(amount)),
            new Field(l1address),
            new Field(0),
            new Field(0)
            ]
        ]);
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

  console.log(
    "--------------------------- Testing Action: Deposit ---------------------------"
    );

  await withL1Client(config, false, (l1client: L1Client) => {
      return deposit(
          l1client,
          new BN(20),
          testChain
      );
  });

  console.log(
    "--------------------------- Testing Action: Withdraw ---------------------------"
    );

  await withL1Client(config, false, (l1client: L1Client) => {
      return verify(
      l1client,
      commandBuffer,
      sha_low,
      sha_high,
      new BN(amount * 10),
      testChain
      );
  });
}

main().then(v => {process.exit();})