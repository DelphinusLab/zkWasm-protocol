import { withL1Client, L1Client } from "../src/clients/client";
import { getConfigByChainName } from "zkwasm-deployment/src/config";
import { L1ClientRole } from "zkwasm-deployment/src/types";

//
async function setVerifierTests(testChain: string) {
    let config = await getConfigByChainName(L1ClientRole.Monitor, testChain);
    try {
      await withL1Client(config, false, async (l1client: L1Client) => {
        let proxy = l1client.getProxyContract();
        let infoBeforeSet = await proxy.getProxyInfo();
        let vidBeforeSet = infoBeforeSet["verifier"];
        console.log("Verifier before setVerifier:", vidBeforeSet);
        if(vidBeforeSet == "0") {
            console.error(`Error: Please deploy contracts on ${testChain}`);
            return;
        }

        await proxy.setVerifier("0x0000000000000000000000000000000000000000");

        let infoAfterSet = await proxy.getProxyInfo();
        let vidAfterSet = infoAfterSet["verifier"];
        console.log("Verifier after setVerifier:", vidAfterSet);
        if(vidAfterSet == "0") {
            console.log("SetVerifier Test PASSED");
        } else {
            console.error("Error: SetVerifier Test Failed");
            return;
        }
      });
    } catch (err) {
      console.log("%s", err);
    }
}

async function main() {
    console.log("========================== Testing setVerifier ==========================");
    await setVerifierTests(process.argv[2]);
}

main().then(v => {process.exit();})
