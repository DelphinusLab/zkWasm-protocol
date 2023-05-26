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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bn_js_1 = __importDefault(require("bn.js"));
const client_1 = require("../../src/clients/client");
const config_1 = require("zkwasm-deployment/src/config");
const pbinder_1 = require("web3subscriber/src/pbinder");
const types_1 = require("zkwasm-deployment/src/types");
function main(configName, targetAccount) {
    return __awaiter(this, void 0, void 0, function* () {
        let config = yield (0, config_1.getConfigByChainName)(types_1.L1ClientRole.Monitor, configName);
        let account = config.monitorAccount;
        let pbinder = new pbinder_1.PromiseBinder();
        let r = pbinder.return(() => __awaiter(this, void 0, void 0, function* () {
            yield (0, client_1.withL1Client)(config, false, (l1client) => __awaiter(this, void 0, void 0, function* () {
                let token = l1client.getTokenContract();
                // await web3.eth.net.getId();
                try {
                    pbinder.snapshot("Mint");
                    console.log("mint token:", token.address());
                    let balance = yield token.balanceOf(account);
                    console.log("sender: balance before mint:", balance);
                    yield pbinder.bind("mint", token.mint(new bn_js_1.default("10000000000000000000")));
                    balance = yield token.balanceOf(account);
                    console.log("sender: balance after mint", balance);
                    if (targetAccount) {
                        yield pbinder.bind("transfer", token.transfer(targetAccount, new bn_js_1.default("10000000000000000000")));
                        balance = yield token.balanceOf(targetAccount);
                        console.log("balance of recipient after transfer", balance);
                    }
                }
                catch (err) {
                    console.log("%s", err);
                }
            }));
        }));
        yield r.when("mint", "transactionHash", (hash) => console.log(hash));
    });
}
/* .once("transactionHash",hash => console.log(hash) */
main(process.argv[2], process.argv[3]);
//# sourceMappingURL=mint.js.map