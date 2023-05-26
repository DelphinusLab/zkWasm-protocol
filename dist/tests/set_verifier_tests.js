"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../src/clients/client");
const config_1 = require("zkwasm-deployment/src/config");
const types_1 = require("zkwasm-deployment/src/types");
// 
function setVerifierTests(testChain) {
    return __awaiter(this, void 0, void 0, function* () {
        let config = yield (0, config_1.getConfigByChainName)(types_1.L1ClientRole.Monitor, testChain);
        try {
            yield (0, client_1.withL1Client)(config, false, (l1client) => __awaiter(this, void 0, void 0, function* () {
                let proxy = l1client.getProxyContract();
                let infoBeforeSet = yield proxy.getProxyInfo();
                let vidBeforeSet = infoBeforeSet["verifier"];
                console.log("Verifier before setVerifier:", vidBeforeSet);
                if (vidBeforeSet == "0") {
                    console.error(`Error: Please deploy contracts on ${testChain}`);
                    return;
                }
                yield proxy.setVerifier("0x0000000000000000000000000000000000000000");
                let infoAfterSet = yield proxy.getProxyInfo();
                let vidAfterSet = infoAfterSet["verifier"];
                console.log("Verifier after setVerifier:", vidAfterSet);
                if (vidAfterSet == "0") {
                    console.log("SetVerifier Test PASSED");
                }
                else {
                    console.error("Error: SetVerifier Test Failed");
                    return;
                }
            }));
        }
        catch (err) {
            console.log("%s", err);
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("========================== Testing setVerifier ==========================");
        yield setVerifierTests(process.argv[2]);
    });
}
main().then(v => { process.exit(); });
//# sourceMappingURL=set_verifier_tests.js.map