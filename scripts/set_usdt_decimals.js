"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const { ethers } = require("hardhat");
const constants = __importStar(require("./const.ts"));
// USDT decimals for different networks
const USDT_DECIMALS = {
    // Ethereum Mainnet - USDT has 6 decimals
    1: 6,
    // Sepolia Testnet - Mock USDT usually has 18 decimals
    11155111: 18,
    // BSC Mainnet - USDT has 18 decimals
    56: 18,
    // BSC Testnet - Mock USDT usually has 18 decimals
    97: 18,
    // Polygon Mainnet - USDT has 6 decimals
    137: 6,
    // Polygon Mumbai Testnet
    80001: 18
};
async function main() {
    const proxy = await ethers.getContractAt("Proxy", constants.proxyAddress);
    // Get current network
    const network = await ethers.provider.getNetwork();
    const chainId = network.chainId;
    console.log(`Setting USDT decimals for chain ID: ${chainId}`);
    // Get decimals for current network
    let decimals = USDT_DECIMALS[chainId];
    if (decimals === undefined) {
        console.warn(`No USDT decimals configured for chain ID: ${chainId}, using default 18`);
        decimals = 18;
    }
    console.log(`Setting USDT decimals to: ${decimals}`);
    // Validate decimals
    if (decimals <= 0 || decimals > 18) {
        console.error(`Invalid decimals: ${decimals}. Must be between 1 and 18.`);
        process.exit(1);
    }
    // Set USDT decimals
    const tx = await proxy.setUsdtDecimals(decimals);
    console.log("Transaction hash:", tx.hash);
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    // Verify the setting
    const currentDecimals = await proxy.usdtDecimals();
    console.log("Current USDT decimals:", currentDecimals.toString());
    if (currentDecimals.toString() === decimals.toString()) {
        console.log("✅ USDT decimals set successfully!");
    }
    else {
        console.error("❌ Failed to set USDT decimals correctly");
        process.exit(1);
    }
}
main().catch((error) => {
    console.error("❌ Error:", error);
    process.exitCode = 1;
});
