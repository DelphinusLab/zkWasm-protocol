const GasTokenInfo = require("../../../build/contracts/Gas.json");
const TokenInfo = require("../../../build/contracts/Token.json");
const ProxyInfo = require("../../../build/contracts/Proxy.json");

const DelphinusProxyInterface = require("../../../build/contracts/DelphinusProxy.json");
const ERC20Interface = require("../../../build/contracts/ERC20.json");
const GasInterface = require("../../../build/contracts/Gas.json");

export const contractsInfo = {
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
        chainId: "11155111",
        address:TokenInfo.networks["11155111"]?.address.replace("0x", ""),
        wei:18,
        name:"tToken"
      },
      {
        chainId: "5",
        address:TokenInfo.networks["5"]?.address.replace("0x", ""),
        wei:18,
        name:"tToken"
      },
      {
        chainId: "5",
        address:GasTokenInfo.networks["5"]?.address.replace("0x", ""),
        wei:18,
        name:"rio",
      },
      {
        chainId: "97",
        address:TokenInfo.networks["97"]?.address.replace("0x", ""),
        wei:18,
        name:"tToken"
      },
      {
        chainId: "740",
        address:TokenInfo.networks["740"]?.address.replace("0x", ""),
        wei:18,
        name:"tToken"
      },
      {
        chainId: "2814",
        address:TokenInfo.networks["2814"]?.address.replace("0x", ""),
        wei:18,
        name:"tToken"
      }
    ]
}

const fs = require("fs");
const path = require("path");

fs.writeFileSync(
    path.resolve(__dirname, "../../../node_modules/zkwasm-deployment/config", "contracts-info.json"),
    JSON.stringify(contractsInfo, undefined, 2)
);

