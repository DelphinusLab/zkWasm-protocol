import { Web3ProviderMode } from "web3subscriber/src/client";
import { DelphinusHttpProvider } from "web3subscriber/src/provider";
import { getConfigByChainName } from "delphinus-deployment/src/config";
import { L1ClientRole } from "delphinus-deployment/src/types";

async function main(){
    let testChain = process.argv[2];
    let config = await getConfigByChainName(L1ClientRole.Monitor, testChain)
    let providerConfig = {
        provider: new DelphinusHttpProvider(config.rpcSource),
        monitorAccount: config.monitorAccount,
    };
    let web3 = new Web3ProviderMode(providerConfig);
    let ProxyJSON = require("../../build/contracts/Proxy.json");
    let contract = web3.getContract(ProxyJSON, ProxyJSON.networks[config.deviceId].address, config.monitorAccount);
    let preBlockHeight = require("./blockNumberBeforeDeployment.json");
    let startingPoint = preBlockHeight[testChain];
    let pastEvents = await contract.getWeb3Contract().getPastEvents("allEvents", {
        fromBlock: startingPoint,
    })
    for(let r of pastEvents){
        console.log(
        "======================= Get L1 Event: %s ======================",
        r.event
        );
        console.log("blockNumber:", r.blockNumber);
        console.log("blockHash:", r.blockHash);
        console.log("transactionHash:", r.transactionHash);
    }
}

main().then(v => {process.exit();})