import BN from "bn.js";
import { TxData, TxWithdraw, Address} from "../src/index";
import { withL1Client, L1Client } from "../src/clients/client";
import { RidInfo } from "../src/clients/contracts/proxy";
import { getConfigByChainName } from "zkwasm-deployment/src/config";
import { L1ClientRole } from "zkwasm-deployment/src/types";
import { Web3ProviderMode } from "web3subscriber/src/client";
import { DelphinusHttpProvider } from "web3subscriber/src/provider";
import { encodeL1address, toHexStr } from "web3subscriber/src/addresses";
import { PromiseBinder } from "web3subscriber/src/pbinder";
/*
import { RidInfo } from "../src/clients/contracts/proxy";
*/

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

// TODO add proof, batchinstance, aux parameters
export async function test_verify(
    l1client: L1Client,
    txdata: TxData,
    testChain: string,
    action: string,
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
        batch_size: new BN("1")
      };
      let tx = txdata.verify(
        l1client,
        [new BN("0")], // proof
        [new BN("0")], // batchinstance
        [new BN("0")], // aux
        ridInfo
      );
      let r = await tx.when("Verify", "transactionHash", (hash: string) => {
        console.log("Get transactionHash", hash);
        txhash = hash;
      });
      console.log("done", r.blockHash);
      console.log("Send Transaction Successfully: Passed");
      let e = await getEvent(action, r.blockNumber, testChain);
      console.log(e);
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
    let pbinder = new PromiseBinder();
    let r = pbinder.return(async () => {
      await withL1Client(config, false, async (l1client: L1Client) => {
        let token = l1client.getTokenContract();
        try {
          pbinder.snapshot("Mint");
          console.log("mint token:", token.address());
          let balance = await token.balanceOf(account);

          if(balance.cmp(new BN(10000)) == -1) {
            console.log("Monitor Account's balance before mint:", balance.toString(10));
            await pbinder.bind("mint", token.mint(new BN("1000000")));
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

export async function addToken(testChain: string){
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
