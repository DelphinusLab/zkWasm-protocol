import Web3 from "web3";
import fs from "fs-extra";
import { getConfigByChainName } from "delphinus-deployment/src/config";
import { L1ClientRole } from "delphinus-deployment/src/types";

async function main() {
  const root = require("path");
  let path;
  if(process.argv[3]){
    const absolutePath = root.resolve(process.argv[3]);
    if (!fs.existsSync(absolutePath)) {
      console.error('Directory does not exist');
      process.exit(-1);
    }
    path = absolutePath + "/blockNumberBeforeDeployment.json";
  }else{
    path = "blockNumberBeforeDeployment.json";
  }
  if (fs.existsSync(path)) {
    console.error('WARNING: blockNumberBeforeDeployment.json already exist in current directory, please delete the previous one if you want to regenerate it');
    process.exit(-1);
  }
  const { writeFileSync } = require('fs');

  interface bnInfo {
    [key: string]: any
  }
  const latestBlock: bnInfo = {};
  let chainName =process.argv[2];
  const config = await getConfigByChainName(L1ClientRole.Monitor, chainName)

  try {
      let web3 = getWeb3FromSource(config.rpcSource);
      await web3.eth.getBlockNumber(async function(err, result) {  
        if (err) {
          throw err;
        } else {
          latestBlock[config.chainName] = result;
        }
      });
    writeFileSync(path, JSON.stringify(latestBlock,null,2), 'utf8');
    console.log("Latest Block Number has been generated");
  } catch (err) {
    console.log('An error has occurred ', err);
  }
}

function getWeb3FromSource(provider: string) {
    const HttpProvider = "https";
    if(provider.includes(HttpProvider)){
      return new Web3(new Web3.providers.HttpProvider(provider));
    }else {
      return new Web3(new Web3.providers.WebsocketProvider(provider));
    }
  }

main().then(v => {process.exit();})