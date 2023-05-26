"use strict";
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractsInfo = void 0;
const GasTokenInfo = require("../../../build/contracts/Gas.json");
const TokenInfo = require("../../../build/contracts/Token.json");
const ProxyInfo = require("../../../build/contracts/Proxy.json");
const DelphinusProxyInterface = require("../../../build/contracts/DelphinusProxy.json");
const ERC20Interface = require("../../../build/contracts/ERC20.json");
const GasInterface = require("../../../build/contracts/Gas.json");
exports.contractsInfo = {
    addressMap: {
        gasToken: GasTokenInfo.networks,
        testToken: TokenInfo.networks,
        proxy: ProxyInfo.networks,
    },
    interfaceMap: {
        proxy: {
            abi: DelphinusProxyInterface.abi,
        },
        gas: {
            abi: GasInterface.abi,
        },
        erc20: {
            abi: ERC20Interface.abi,
        },
    },
    tokens: [
        {
            chainId: "15",
            address: (_a = TokenInfo.networks["15"]) === null || _a === void 0 ? void 0 : _a.address.replace("0x", ""),
            wei: 12,
            name: "tToken"
        },
        {
            chainId: "15",
            address: (_b = GasTokenInfo.networks["15"]) === null || _b === void 0 ? void 0 : _b.address.replace("0x", ""),
            wei: 12,
            name: "rio"
        },
        {
            chainId: "16",
            address: (_c = TokenInfo.networks["16"]) === null || _c === void 0 ? void 0 : _c.address.replace("0x", ""),
            wei: 12,
            name: "sToken",
        },
        {
            chainId: "5",
            address: (_d = TokenInfo.networks["5"]) === null || _d === void 0 ? void 0 : _d.address.replace("0x", ""),
            wei: 18,
            name: "tToken"
        },
        {
            chainId: "5",
            address: (_e = GasTokenInfo.networks["5"]) === null || _e === void 0 ? void 0 : _e.address.replace("0x", ""),
            wei: 18,
            name: "rio",
        },
        {
            chainId: "97",
            address: (_f = TokenInfo.networks["97"]) === null || _f === void 0 ? void 0 : _f.address.replace("0x", ""),
            wei: 18,
            name: "tToken"
        },
        {
            chainId: "740",
            address: (_g = TokenInfo.networks["740"]) === null || _g === void 0 ? void 0 : _g.address.replace("0x", ""),
            wei: 18,
            name: "tToken"
        },
        {
            chainId: "2814",
            address: (_h = TokenInfo.networks["2814"]) === null || _h === void 0 ? void 0 : _h.address.replace("0x", ""),
            wei: 18,
            name: "tToken"
        }
    ]
};
const fs = require("fs");
const path = require("path");
fs.writeFileSync(path.resolve(__dirname, "../../../node_modules/zkwasm-deployment/config", "contracts-info.json"), JSON.stringify(exports.contractsInfo, undefined, 2));
//# sourceMappingURL=config-contracts-info.js.map