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
const sha256_1 = __importDefault(require("crypto-js/sha256"));
const enc_hex_1 = __importDefault(require("crypto-js/enc-hex"));
const field_1 = require("delphinus-curves/src/field");
const client_1 = require("../src/clients/client");
const config_1 = require("zkwasm-deployment/src/config");
const types_1 = require("zkwasm-deployment/src/types");
const client_2 = require("web3subscriber/src/client");
const provider_1 = require("web3subscriber/src/provider");
const client_3 = require("../src/clients/client");
function getEvent(action, blockNumber, testChain) {
    return __awaiter(this, void 0, void 0, function* () {
        let config = yield (0, config_1.getConfigByChainName)(types_1.L1ClientRole.Monitor, testChain);
        let providerConfig = {
            provider: new provider_1.DelphinusHttpProvider(config.rpcSource),
            monitorAccount: config.monitorAccount,
        };
        let web3 = new client_2.Web3ProviderMode(providerConfig);
        let ProxyJSON = require("../../build/contracts/Proxy.json");
        let contract = web3.getContract(ProxyJSON, ProxyJSON.networks[config.deviceId].address, config.monitorAccount);
        let pastEvents = yield contract.getWeb3Contract().getPastEvents("allEvents", {
            filter: { blockNumber: blockNumber },
            fromBlock: blockNumber,
        });
        for (let r of pastEvents) {
            console.log("--------------------- Get L1 Event: %s ---------------------", r.event);
            console.log("blockNumber:", r.blockNumber);
            console.log("blockHash:", r.blockHash);
            console.log("transactionHash:", r.transactionHash);
            if (r.returnValues.l2account == "1") {
                if (action != "withdraw") {
                    console.log("SideEffect Check Failed: Action" + action + "should not call SideEffect!");
                }
                else {
                    console.log("SideEffect Check: Passed");
                }
            }
            else {
                if (action == "withdraw") {
                    console.log("SideEffect Check Failed: Action" + action + "should call SideEffect!");
                }
                else {
                    console.log("SideEffect Check: Passed");
                }
            }
        }
    });
}
function verify(l1client, command, sha_low, sha_high, testChain, action, vid = 0) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("start to send to:", l1client.getChainIdHex());
        while (true) {
            let txhash = "";
            try {
                let proxy = l1client.getProxyContract();
                let currentRid = new bn_js_1.default(0);
                let currentMerkleRoot = "";
                let newToken = new bn_js_1.default(0);
                yield proxy.getProxyInfo().then((Proxyinfo) => {
                    currentRid = Proxyinfo.rid;
                    currentMerkleRoot = Proxyinfo.merkle_root.toString();
                    newToken = new bn_js_1.default(Proxyinfo.amount_token + 1);
                });
                yield proxy.addToken(newToken);
                let ridInfo = { rid: new bn_js_1.default(currentRid), batch_size: new bn_js_1.default("10") };
                let tx = proxy.verify(command, [new bn_js_1.default("0")], [new bn_js_1.default("0")], [new bn_js_1.default("0")], [[currentMerkleRoot, currentMerkleRoot, sha_low.toString(), sha_high.toString()]], vid, ridInfo);
                let r = yield tx.when("Verify", "transactionHash", (hash) => {
                    console.log("Get transactionHash", hash);
                    txhash = hash;
                });
                console.log("done", r.blockHash);
                console.log("Send Transaction Successfully: Passed");
                yield getEvent(action, r.blockNumber, testChain);
                console.log("Get AckEvent successfully: Passed");
                return r;
            }
            catch (e) {
                if (txhash !== "") {
                    console.log("exception with transactionHash ready", " will retry ...");
                    console.log("exception with transactionHash ready", " will retry ...");
                    throw e;
                }
                else {
                    if (e.message == "ESOCKETTIMEDOUT") {
                        yield new Promise((resolve) => setTimeout(resolve, 5000));
                    }
                    else if (e.message == "nonce too low") {
                        console.log("failed on:", l1client.getChainIdHex(), e.message); // not sure
                        return;
                    }
                    else {
                        console.log("Unhandled exception during verify");
                        console.log(e);
                        throw e;
                    }
                }
            }
        }
    });
}
function main(action) {
    return __awaiter(this, void 0, void 0, function* () {
        let pendingEvents = [];
        if (action == "addpool") {
            let nonce = 0;
            let tokenIndex0 = 0;
            let tokenIndex1 = 1;
            let poolIndex = 0;
            let callerAccountIndex = 0;
            for (let i = 0; i < 10; i++) {
                pendingEvents.push([
                    new field_1.Field(5),
                    [
                        new field_1.Field(0),
                        new field_1.Field(0),
                        new field_1.Field(0),
                        new field_1.Field((0, client_3.dataToBN)(nonce + i)),
                        new field_1.Field((0, client_3.dataToBN)(tokenIndex0 + i)),
                        new field_1.Field((0, client_3.dataToBN)(tokenIndex1 + i)),
                        new field_1.Field(0),
                        new field_1.Field(0),
                        new field_1.Field((0, client_3.dataToBN)(poolIndex + i)),
                        new field_1.Field((0, client_3.dataToBN)(callerAccountIndex + i))
                    ]
                ]);
            }
        }
        else if (action == "deposit") {
            let nonce = 0;
            let accountIndex = 0;
            let tokenIndex = 0;
            let amount = 1;
            let l1_tx_hash = 0;
            let callerAccountIndex = 0;
            for (let i = 0; i < 10; i++) {
                pendingEvents.push([
                    new field_1.Field(0),
                    [
                        new field_1.Field(0),
                        new field_1.Field(0),
                        new field_1.Field(0),
                        new field_1.Field((0, client_3.dataToBN)(nonce + i)),
                        new field_1.Field((0, client_3.dataToBN)(accountIndex + i)),
                        new field_1.Field((0, client_3.dataToBN)(tokenIndex + i)),
                        new field_1.Field((0, client_3.dataToBN)(amount + i)),
                        new field_1.Field((0, client_3.dataToBN)(l1_tx_hash + i)),
                        new field_1.Field((0, client_3.dataToBN)(callerAccountIndex + i)),
                        new field_1.Field(0)
                    ]
                ]);
            }
        }
        else if (action == "retrive") {
            let nonce = 0;
            let accountIndex = 0;
            let poolIndex = 0;
            let amount0 = 0;
            let amount1 = 0;
            for (let i = 0; i < 10; i++) {
                pendingEvents.push([
                    new field_1.Field(3),
                    [
                        new field_1.Field(0),
                        new field_1.Field(0),
                        new field_1.Field(0),
                        new field_1.Field((0, client_3.dataToBN)(nonce + i)),
                        new field_1.Field((0, client_3.dataToBN)(accountIndex + i)),
                        new field_1.Field((0, client_3.dataToBN)(poolIndex + i)),
                        new field_1.Field((0, client_3.dataToBN)(amount0 + i)),
                        new field_1.Field((0, client_3.dataToBN)(amount1 + i)),
                        new field_1.Field(0),
                        new field_1.Field(0)
                    ]
                ]);
            }
        }
        else if (action == "setkey") {
            let nonce = 0;
            let accountIndex = 0;
            for (let i = 0; i < 10; i++) {
                pendingEvents.push([
                    new field_1.Field(6),
                    [
                        new field_1.Field(0),
                        new field_1.Field(0),
                        new field_1.Field(0),
                        new field_1.Field((0, client_3.dataToBN)(nonce + i)),
                        new field_1.Field((0, client_3.dataToBN)(accountIndex + i)),
                        new field_1.Field(0),
                        new field_1.Field(0),
                        new field_1.Field(0),
                        new field_1.Field(0),
                        new field_1.Field(0)
                    ]
                ]);
            }
        }
        else if (action == "supply") {
            let nonce = 0;
            let accountIndex = 0;
            let poolIndex = 0;
            let amount0 = 1;
            let amount1 = 1;
            for (let i = 0; i < 10; i++) {
                pendingEvents.push([
                    new field_1.Field(4),
                    [
                        new field_1.Field(0),
                        new field_1.Field(0),
                        new field_1.Field(0),
                        new field_1.Field((0, client_3.dataToBN)(nonce + i)),
                        new field_1.Field((0, client_3.dataToBN)(accountIndex + i)),
                        new field_1.Field((0, client_3.dataToBN)(poolIndex + i)),
                        new field_1.Field((0, client_3.dataToBN)(amount0 + i)),
                        new field_1.Field((0, client_3.dataToBN)(amount1 + i)),
                        new field_1.Field(0),
                        new field_1.Field(0)
                    ]
                ]);
            }
        }
        else if (action == "swap") {
            let nonce = 0;
            let accountIndex = 0;
            let poolIndex = 0;
            let reverse = 0;
            let amount = 0;
            for (let i = 0; i < 10; i++) {
                pendingEvents.push([
                    new field_1.Field(2),
                    [
                        new field_1.Field(0),
                        new field_1.Field(0),
                        new field_1.Field(0),
                        new field_1.Field((0, client_3.dataToBN)(nonce + i)),
                        new field_1.Field((0, client_3.dataToBN)(accountIndex + i)),
                        new field_1.Field((0, client_3.dataToBN)(poolIndex + i)),
                        new field_1.Field((0, client_3.dataToBN)(reverse)),
                        new field_1.Field((0, client_3.dataToBN)(amount + i)),
                        new field_1.Field(0),
                        new field_1.Field(0)
                    ]
                ]);
            }
        }
        else if (action == "withdraw") {
            let nonce = 0;
            let accountIndex = 0;
            let tokenIndex = 0;
            let amount = 0;
            let l1address = 0;
            for (let i = 0; i < 10; i++) {
                pendingEvents.push([
                    new field_1.Field(1),
                    [
                        new field_1.Field(0),
                        new field_1.Field(0),
                        new field_1.Field(0),
                        new field_1.Field((0, client_3.dataToBN)(nonce + i)),
                        new field_1.Field((0, client_3.dataToBN)(accountIndex + i)),
                        new field_1.Field((0, client_3.dataToBN)(tokenIndex)),
                        new field_1.Field((0, client_3.dataToBN)(amount + i)),
                        new field_1.Field((0, client_3.dataToBN)(l1address + i)),
                        new field_1.Field(0),
                        new field_1.Field(0)
                    ]
                ]);
            }
        }
        else {
            console.log("No Action Match");
            return;
        }
        const data = pendingEvents
            .map((command) => [
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
            .join(""))
            .join("");
        const hvalue = (0, sha256_1.default)(enc_hex_1.default.parse(data)).toString();
        const sha_low = new bn_js_1.default(hvalue.slice(0, 32), "hex", "be");
        const sha_high = new bn_js_1.default(hvalue.slice(32, 64), "hex", "be");
        let testChain = process.argv[3];
        let config = yield (0, config_1.getConfigByChainName)(types_1.L1ClientRole.Monitor, testChain);
        console.log("============================== Testing Action: %s ==============================", action);
        yield (0, client_1.withL1Client)(config, false, (l1client) => {
            return verify(l1client, data, sha_low, sha_high, config.chainName, action);
        });
    });
}
main(process.argv[2]).then(v => { process.exit(); });
//# sourceMappingURL=action_test.js.map