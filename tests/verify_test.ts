import BN from "bn.js";
import { TxData, TxWithdraw} from "../src/index";
import { withL1Client, L1Client } from "../src/clients/client";
import { RidInfo } from "../src/clients/contracts/proxy";
import { getConfigByChainName } from "zkwasm-deployment/src/config";
import { L1ClientRole } from "zkwasm-deployment/src/types";
import { Web3ProviderMode } from "web3subscriber/src/client";
import { DelphinusHttpProvider } from "web3subscriber/src/provider";

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
  command: string,
  currentMerkle: BN,
  finalMerkle: BN,
  shaLow: BN,
  shaHigh: BN,
  testChain: string,
  action:  string,
) {
  console.log("start to send to:", l1client.getChainIdHex());
  while (true) {
    let txhash = "";
    try {
      let proxy = l1client.getProxyContract();
      let proxyInfo = await proxy.getProxyInfo();
      console.assert(proxyInfo.merkle_root = currentMerkle);
      let ridInfo: RidInfo = {
        rid: new BN(proxyInfo.rid),
        batch_size: new BN("1")
      };
      let tx = proxy.verify(
        command,
        [new BN("0")],
        [new BN("0")],
        [new BN("0")],
        [[currentMerkle.toString(), finalMerkle.toString(), shaLow.toString(), shaHigh.toString()]],
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

async function main(currentMerkle: string, finalMerkle:string) {
    let txwithdraw = new TxWithdraw(
            new BN(0),
            new BN(0),
            new BN(0),
            new BN(1).shln(12),
            new BN("D91A86B4D8551290655caCED21856eF6E532F2D4", 16)
    );
    let txdata = new TxData(
            new BN(currentMerkle, 16),
            new BN(finalMerkle, 16),
            [txwithdraw]
    );
    let inputs = txdata.getVerifierInputs();
    let publicInputsBytes = inputs.map((x) => {
        return x.toBuffer("le", 32).toString("hex")
    }).join("");
    console.log(publicInputsBytes);

    let privateInputsBytes = txdata.getZkwasmInputs().join("");
    console.log(privateInputsBytes);


    let testChain = process.argv[3]
    let config = await getConfigByChainName(L1ClientRole.Monitor, testChain)
    console.log(
        "============================== Testing Action: %s ==============================",
        "withdraw"
    );
    await withL1Client(config, false, (l1client: L1Client) => {
        return verify(
          l1client,
          txwithdraw.toBinary("be"),
          txdata.oldroot,
          txdata.newroot,
          txdata.shaLow,
          txdata.shaHigh,
          config.chainName,
          "withdraw"
        );
    });
}

main(process.argv[2], process.argv[3]).then(v => {process.exit();})
