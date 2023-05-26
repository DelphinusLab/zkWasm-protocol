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
const addresses_1 = require("web3subscriber/src/addresses");
const pbinder_1 = require("web3subscriber/src/pbinder");
const client_2 = require("../src/clients/client");
function mintToken(testChain) {
    return __awaiter(this, void 0, void 0, function* () {
        let config = yield (0, config_1.getConfigByChainName)(types_1.L1ClientRole.Monitor, testChain);
        let account = config.monitorAccount;
        let pbinder = new pbinder_1.PromiseBinder();
        let r = pbinder.return(() => __awaiter(this, void 0, void 0, function* () {
            yield (0, client_1.withL1Client)(config, false, (l1client) => __awaiter(this, void 0, void 0, function* () {
                let token = l1client.getTokenContract();
                try {
                    pbinder.snapshot("Mint");
                    console.log("mint token:", token.address());
                    let balance = yield token.balanceOf(account);
                    if (balance.cmp(new bn_js_1.default(100)) == -1) {
                        console.log("Monitor Account's balance before mint:", balance.toString(10));
                        yield pbinder.bind("mint", token.mint(new bn_js_1.default("1000")));
                        balance = yield token.balanceOf(account);
                        console.log("Monitor Account's balance:", balance.toString(10));
                    }
                    else {
                        console.log("Monitor Account's balance:", balance.toString(10));
                        console.log("Monitor Account Have Enough Test Token To DO DEPOSIT & WITHDRAW TEST, SKIPED MINT");
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
function addToken(testChain) {
    return __awaiter(this, void 0, void 0, function* () {
        let config = yield (0, config_1.getConfigByChainName)(types_1.L1ClientRole.Monitor, testChain);
        let tokenIndex = 0;
        try {
            yield (0, client_1.withL1Client)(config, false, (l1client) => __awaiter(this, void 0, void 0, function* () {
                let proxy = l1client.getProxyContract();
                let token = l1client.getTokenContract();
                let existing_tokens = yield proxy.allTokens();
                let tokenUid = (0, addresses_1.encodeL1address)(token.address().replace("0x", ""), parseInt(config.deviceId).toString(16));
                let checkExistToken = 0;
                for (let i = 0; i < existing_tokens.length; i++) {
                    if (existing_tokens[i].token_uid == tokenUid.toString()) {
                        console.log("Test Token:" + tokenUid + "Exist");
                        tokenIndex = i;
                        console.log("Token Index is:", tokenIndex);
                        checkExistToken = 1;
                    }
                }
                if (checkExistToken == 0) {
                    console.log(`Adding test token uid: ${tokenUid.toString(16)}`);
                    let tx = yield proxy.addToken(tokenUid);
                    console.log("Token Index is:", tokenIndex);
                }
            }));
        }
        catch (err) {
            console.log("%s", err);
        }
        return tokenIndex;
    });
}
function deposit(l1client, depositAmount, testChain) {
    return __awaiter(this, void 0, void 0, function* () {
        let proxy = l1client.getProxyContract();
        let tokenContract = l1client.getTokenContract();
        let config = yield (0, config_1.getConfigByChainName)(types_1.L1ClientRole.Monitor, testChain);
        let balanceOfMonitor = yield tokenContract.balanceOf(config.monitorAccount);
        let ProxyJSON = require("../../build/contracts/Proxy.json");
        let balanceOfContract = yield tokenContract.balanceOf(ProxyJSON.networks[config.deviceId].address);
        yield proxy.deposit(tokenContract, depositAmount, config.monitorAccount, "0");
        let balanceOfMonitorAfter = yield tokenContract.balanceOf(config.monitorAccount);
        let balanceOfContractAfter = yield tokenContract.balanceOf(ProxyJSON.networks[config.deviceId].address);
        if (balanceOfMonitor.toString(10) == balanceOfMonitorAfter.add(depositAmount).toString(10)) {
            console.log("Monitor Balance Check: PASSED");
        }
        else {
            console.log("Monitor Balance Check: FAILED");
        }
        if (balanceOfContractAfter.toString(10) == balanceOfContract.add(depositAmount).toString(10)) {
            console.log("Contract Balance Check: PASSED");
        }
        else {
            console.log("Contract Balance Check: FAILED");
        }
    });
}
function verify(l1client, command, sha_low, sha_high, totalAmount, batchSize, testChain, vid = 0) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("start to send to:", l1client.getChainIdHex());
        while (true) {
            let txhash = "";
            try {
                let proxy = l1client.getProxyContract();
                let tokenContract = l1client.getTokenContract();
                let config = yield (0, config_1.getConfigByChainName)(types_1.L1ClientRole.Monitor, testChain);
                let balanceOfMonitor = yield tokenContract.balanceOf(config.monitorAccount);
                console.log("Monitor Account Before", balanceOfMonitor.toString(10));
                let ProxyJSON = require("../../build/contracts/Proxy.json");
                let balanceOfContract = yield tokenContract.balanceOf(ProxyJSON.networks[config.deviceId].address);
                console.log("Contract Account Before", balanceOfContract.toString(10));
                let currentRid = new bn_js_1.default(0);
                let currentMerkleRoot = "";
                yield proxy.getProxyInfo().then((Proxyinfo) => {
                    currentRid = Proxyinfo.rid;
                    currentMerkleRoot = Proxyinfo.merkle_root.toString();
                });
                let ridInfo = { rid: new bn_js_1.default(currentRid), batch_size: new bn_js_1.default(batchSize) };
                let tx = proxy.verify(command, [new bn_js_1.default("0")], [new bn_js_1.default("0")], [new bn_js_1.default("0")], [[currentMerkleRoot, currentMerkleRoot, sha_low.toString(), sha_high.toString()]], vid, ridInfo);
                let r = yield tx.when("Verify", "transactionHash", (hash) => {
                    console.log("Get transactionHash", hash);
                    txhash = hash;
                });
                console.log("done", r.blockHash);
                let balanceOfMonitorAfter = yield tokenContract.balanceOf(config.monitorAccount);
                console.log("Monitor Account After", balanceOfMonitorAfter.toString(10));
                let balanceOfContractAfter = yield tokenContract.balanceOf(ProxyJSON.networks[config.deviceId].address);
                console.log("Contract Account After", balanceOfContractAfter.toString(10));
                if (balanceOfMonitor.toString(10) == balanceOfMonitorAfter.sub(totalAmount).toString(10)) {
                    console.log("Monitor Balance Check: PASSED");
                }
                else {
                    console.log("Monitor Balance Check: FAILED");
                }
                if (balanceOfContractAfter.toString(10) == balanceOfContract.sub(totalAmount).toString(10)) {
                    console.log("Contract Balance Check: PASSED");
                }
                else {
                    console.log("Contract Balance Check: FAILED");
                }
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
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let testChain = process.argv[2];
        let batchSize = process.argv[3];
        let pendingEvents = [];
        console.log("========================== Deposit & Withdraw Balance Check ==========================");
        yield mintToken(testChain);
        let tokenIdx = yield addToken(testChain);
        let nonce = 0;
        let accountIndex = 0;
        let tokenIndex = tokenIdx;
        let amount = 1;
        let config = yield (0, config_1.getConfigByChainName)(types_1.L1ClientRole.Monitor, testChain);
        let l1address = (0, addresses_1.encodeL1address)(config.monitorAccount.replace("0x", ""), parseInt(config.deviceId).toString(16));
        for (let i = 0; i < parseInt(batchSize); i++) {
            pendingEvents.push([
                new field_1.Field(1),
                [
                    new field_1.Field(0),
                    new field_1.Field(0),
                    new field_1.Field(0),
                    new field_1.Field((0, client_2.dataToBN)(nonce + i)),
                    new field_1.Field((0, client_2.dataToBN)(accountIndex)),
                    new field_1.Field((0, client_2.dataToBN)(tokenIndex)),
                    new field_1.Field((0, client_2.dataToBN)(amount)),
                    new field_1.Field(l1address),
                    new field_1.Field(0),
                    new field_1.Field(0)
                ]
            ]);
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
        console.log("--------------------------- Testing Action: Deposit ---------------------------");
        yield (0, client_1.withL1Client)(config, false, (l1client) => {
            return deposit(l1client, new bn_js_1.default(20), testChain);
        });
        console.log("--------------------------- Testing Action: Withdraw ---------------------------");
        yield (0, client_1.withL1Client)(config, false, (l1client) => {
            return verify(l1client, data, sha_low, sha_high, new bn_js_1.default(amount * parseInt(batchSize)), batchSize, testChain);
        });
    });
}
main().then(v => { process.exit(); });
//# sourceMappingURL=deposit_withdraw_test.js.map