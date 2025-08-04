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
// Network configurations
const NETWORK_CONFIGS = {
    // Ethereum Mainnet
    1: {
        name: "Ethereum Mainnet",
        uniswap: {
            factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
            router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
            usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
        },
        usdtDecimals: 6
    },
    // Sepolia Testnet
    11155111: {
        name: "Sepolia Testnet",
        uniswap: {
            factory: "0x7E0987E5b3a30e3f2828572Bb659A548460a3003",
            router: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008",
            usdt: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06"
        },
        usdtDecimals: 18
    },
    // BSC Mainnet
    56: {
        name: "BSC Mainnet",
        uniswap: {
            factory: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
            router: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
            usdt: "0x55d398326f99059fF775485246999027B3197955"
        },
        usdtDecimals: 18
    },
    // BSC Testnet
    97: {
        name: "BSC Testnet",
        uniswap: {
            factory: "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
            router: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
            usdt: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"
        },
        usdtDecimals: 18
    }
};
async function main() {
    console.log("🚀 SETTING UP TOKEN LAUNCH FUNCTIONALITY");
    console.log("=".repeat(60));
    const proxy = await ethers.getContractAt("Proxy", constants.proxyAddress);
    // Get current network
    const network = await ethers.provider.getNetwork();
    const chainId = network.chainId;
    console.log(`Network: ${chainId}`);
    console.log(`Proxy Address: ${constants.proxyAddress}`);
    // Get network config
    const config = NETWORK_CONFIGS[chainId];
    if (!config) {
        console.error(`❌ No configuration found for chain ID: ${chainId}`);
        console.log("Available chain IDs:", Object.keys(NETWORK_CONFIGS));
        process.exit(1);
    }
    console.log(`Network Name: ${config.name}`);
    console.log();
    // Check current owner
    try {
        const proxyInfo = await proxy.getProxyInfo();
        const [signer] = await ethers.getSigners();
        console.log(`Current Owner: ${proxyInfo.owner}`);
        console.log(`Signer Address: ${signer.address}`);
        if (proxyInfo.owner.toLowerCase() !== signer.address.toLowerCase()) {
            console.error("❌ Error: Signer is not the contract owner!");
            console.log("Only the owner can set these configurations.");
            process.exit(1);
        }
        console.log("✅ Signer is the contract owner");
        console.log();
    }
    catch (error) {
        console.error("❌ Error checking owner:", error.message);
        process.exit(1);
    }
    // Step 1: Set Uniswap addresses
    console.log("📍 Step 1: Setting Uniswap addresses...");
    console.log(`  Factory: ${config.uniswap.factory}`);
    console.log(`  Router:  ${config.uniswap.router}`);
    console.log(`  USDT:    ${config.uniswap.usdt}`);
    try {
        const tx1 = await proxy.setUniswapAddresses(config.uniswap.factory, config.uniswap.router, config.uniswap.usdt);
        console.log(`  Transaction: ${tx1.hash}`);
        const receipt1 = await tx1.wait();
        console.log(`  ✅ Confirmed in block ${receipt1.blockNumber}`);
        console.log(`  Gas used: ${receipt1.gasUsed.toString()}`);
    }
    catch (error) {
        console.error("❌ Error setting Uniswap addresses:", error.message);
        process.exit(1);
    }
    console.log();
    // Step 2: Set USDT decimals
    console.log("🔢 Step 2: Setting USDT decimals...");
    console.log(`  Decimals: ${config.usdtDecimals}`);
    try {
        const tx2 = await proxy.setUsdtDecimals(config.usdtDecimals);
        console.log(`  Transaction: ${tx2.hash}`);
        const receipt2 = await tx2.wait();
        console.log(`  ✅ Confirmed in block ${receipt2.blockNumber}`);
        console.log(`  Gas used: ${receipt2.gasUsed.toString()}`);
    }
    catch (error) {
        console.error("❌ Error setting USDT decimals:", error.message);
        process.exit(1);
    }
    console.log();
    // Step 3: Verify configuration
    console.log("🔍 Step 3: Verifying configuration...");
    try {
        // Verify Uniswap addresses
        const factory = await proxy.uniswapV2Factory();
        const router = await proxy.uniswapV2Router();
        const usdt = await proxy.usdtToken();
        const decimals = await proxy.usdtDecimals();
        const factoryMatch = factory.toLowerCase() === config.uniswap.factory.toLowerCase();
        const routerMatch = router.toLowerCase() === config.uniswap.router.toLowerCase();
        const usdtMatch = usdt.toLowerCase() === config.uniswap.usdt.toLowerCase();
        const decimalsMatch = decimals.toString() === config.usdtDecimals.toString();
        console.log(`  Factory:  ${factoryMatch ? "✅" : "❌"} ${factory}`);
        console.log(`  Router:   ${routerMatch ? "✅" : "❌"} ${router}`);
        console.log(`  USDT:     ${usdtMatch ? "✅" : "❌"} ${usdt}`);
        console.log(`  Decimals: ${decimalsMatch ? "✅" : "❌"} ${decimals}`);
        if (factoryMatch && routerMatch && usdtMatch && decimalsMatch) {
            console.log();
            console.log("🎉 TOKEN LAUNCH SETUP COMPLETED SUCCESSFULLY!");
            console.log();
            console.log("📋 Summary:");
            console.log(`  Network: ${config.name} (Chain ID: ${chainId})`);
            console.log(`  Proxy: ${constants.proxyAddress}`);
            console.log(`  Uniswap Factory: ${factory}`);
            console.log(`  Uniswap Router: ${router}`);
            console.log(`  USDT Token: ${usdt}`);
            console.log(`  USDT Decimals: ${decimals}`);
            console.log();
            console.log("🚀 Ready for Token Launch operations!");
        }
        else {
            console.error("❌ Configuration verification failed!");
            process.exit(1);
        }
    }
    catch (error) {
        console.error("❌ Error verifying configuration:", error.message);
        process.exit(1);
    }
    console.log();
    console.log("=".repeat(60));
}
main().catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exitCode = 1;
});
