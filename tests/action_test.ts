import BN from "bn.js";
import sha256 from "crypto-js/sha256";
import hexEnc from "crypto-js/enc-hex";
import { Field } from "delphinus-curves/src/field";
import { DelphinusContract, Web3ProviderMode } from "delphinus-web3subscriber/src/client.js";
import { DelphinusHDWalletProvider } from "delphinus-web3subscriber/src/provider.js";
import { PromiseBinder } from "delphinus-web3subscriber/src/pbinder.js";

async function main(action: string) {
  let BridgeJSON = require("../../build/contracts/Proxy.json");
  let address = BridgeJSON.networks["5"].address;
  let monitorAccount = "0x4D9A852e6AECD3A6E87FecE2cA109780E45E6F2D";
  let privKey = "0xe1336538174201795c5b0b4a90eeece9c060386751684c0ce8eefa003e3d8782";
  let rpcSource = "https://goerli.infura.io/v3/1c8e4178f8954e01a95c8eef7b8af2b7";
  let web3 = new Web3ProviderMode({
    provider: new DelphinusHDWalletProvider(privKey, rpcSource),
    monitorAccount: monitorAccount,
  });
  let contract = new DelphinusContract(web3, BridgeJSON, address, monitorAccount)
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
  try{
    let currentRid = new BN(0);
    let currentMerkleRoot = "";
    let newToken = new BN(0);
    await contract.getWeb3Contract().methods.getProxyInfo().call().then((Proxyinfo:any)=>{
      currentRid = Proxyinfo.rid;
      currentMerkleRoot = Proxyinfo.merkle_root.toString();
      newToken = new BN(Proxyinfo.amount_token + 1);
    });
    contract.getWeb3Contract().methods.addToken(newToken).send()
    console.log("start to send TX to Goerli");
    console.log("Current rid:",currentRid); 
    const pbinder = new PromiseBinder();
    let tx = pbinder.return(async () => {
      return await pbinder.bind(
        "Verify",
        contract.getWeb3Contract().methods.verify(commandBuffer,[new BN("0")],[new BN("0")],[new BN("0")],[[currentMerkleRoot, currentMerkleRoot, sha_low.toString(), sha_high.toString()]], 0, currentRid).send()
      );
    });
    let txhash = "";
    let r = await tx.when("Verify", "transactionHash", (hash: string) => {
      console.log("Get transactionHash:", hash);
      txhash = hash;
    });
    console.log("Get blockHash:", r.blockHash);
    console.log("done");
  }catch(e){
    console.log(e);
  }

  let pastEvents = await contract.getWeb3Contract().getPastEvents("allEvents", {
    fromBlock: 8696475,
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

main(process.argv[2]).then(v => {process.exit();})