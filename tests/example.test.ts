import BN from "bn.js";
import { Field } from "delphinus-curves/src/field";
import { withL1Client, L1Client } from "../clients/client";
import { getConfigByChainName } from "delphinus-deployment/src/config";
import { L1ClientRole } from "delphinus-deployment/src/types";

describe("test example", () => {
    test("test example", async () => {
        jest.setTimeout(60000); //1 minute timeou
        async function verify(
            l1client: L1Client,
            command: number[],
            proof: BN[],
            rid: BN,
            vid: number = 0
          ) {
            console.log("start to send to:", l1client.getChainIdHex());
            while (true) {
              let txhash = "";
              try {
                let bridge = l1client.getBridgeContract();
                let metadata = await bridge.getMetaData();
                if (new BN(metadata.bridgeInfo.rid).gt(rid)) {
                  return;
                }
                if (metadata.bridgeInfo.verifierID){
                  vid = parseInt(metadata.bridgeInfo.verifierID);
                }
                let tx = bridge.verify(command, proof, vid, rid);
                let r = await tx.when("Verify", "transactionHash", (hash: string) => {
                  console.log("Get transactionHash", hash);
                  txhash = hash;
                });
                console.log("done", r.blockHash);
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
        let config = await getConfigByChainName(L1ClientRole.Monitor, "goerli");
        let addPool =5;
        let nonce = 0;
        let tokenIndex0 = 0;
        let tokenIndex1 = 1;
        let poolIndex = 1;
        let callerAccountIndex = 1;
        let batchEvents =             
        [
            [
            new Field(addPool), 
            [
                new Field(0), 
                new Field(0),
                new Field(0), 
                new Field(nonce), 
                new Field(tokenIndex0), 
                new Field(tokenIndex1), 
                new Field(0), 
                new Field(0), 
                new Field(poolIndex),
                new Field(callerAccountIndex)
            ]
        ],
        [
            new Field(addPool), 
            [
                new Field(0), 
                new Field(0),
                new Field(0), 
                new Field(nonce+1), 
                new Field(tokenIndex0+1), 
                new Field(tokenIndex1+1), 
                new Field(0), 
                new Field(0), 
                new Field(poolIndex+1),
                new Field(callerAccountIndex+1)
            ]
        ]
        ];
        const commandBuffer = batchEvents.map(
            e => [
              e[0].v.toArray('be', 1),
              e[1][3].v.toArray('be', 8),
              e[1][4].v.toArray('be', 4),
              e[1][5].v.toArray('be', 4),
              e[1][6].v.toArray('be', 32),
              e[1][7].v.toArray('be', 32)
            ]).flat(2);
        const batchSize = 10;
        await withL1Client(config, false, (l1client: L1Client) => {
            return verify(
              l1client,
              commandBuffer,
              [new BN(0)],
              new BN("10", 10).subn(batchSize)
            );
        });
    // expect("0x3761eb5078fa21d6f47481a1880217947cefe3ee8").toEqual("0x3761eb5078fa21d6f47481a1880217947cefe3ee8");
    });
})

