const { ethers } = require("hardhat");
import * as constants from "./const.ts";

// Uniswap V2 addresses for different networks
const UNISWAP_ADDRESSES = {
    // Ethereum Mainnet
    1: {
        factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
        router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7" // USDT (6 decimals)
    },
    // Sepolia Testnet
    11155111: {
        factory: "0xF62c03E08ada871A0bEb309762E260a7a6a880E6", // Uniswap V2 Factory on Sepolia
        router: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3",  // Uniswap V2 Router on Sepolia
        usdt: "0xa72c34a08aaab2a576c4ae86285bae36260d9b99"    // Mock USDT on Sepolia (18 decimals)
    },
    // BSC Mainnet
    56: {
        factory: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73", // PancakeSwap V2 Factory
        router: "0x10ED43C718714eb63d5aA57B78B54704E256024E",  // PancakeSwap V2 Router
        usdt: "0x55d398326f99059fF775485246999027B3197955"    // USDT on BSC (18 decimals)
    },
    // BSC Testnet
    97: {
        factory: "0x6725F303b657a9451d8BA641348b6761A6CC7a17", // PancakeSwap V2 Factory Testnet
        router: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",  // PancakeSwap V2 Router Testnet
        usdt: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"    // Mock USDT on BSC Testnet (18 decimals)
    }
};

async function main() {
    const proxy = await ethers.getContractAt("Proxy", constants.proxyAddress);
    
    // Get current network
    const network = await ethers.provider.getNetwork();
    const chainId = network.chainId;
    
    console.log(`Setting Uniswap addresses for chain ID: ${chainId}`);
    
    // Get addresses for current network
    const addresses = UNISWAP_ADDRESSES[chainId];
    if (!addresses) {
        console.error(`No Uniswap addresses configured for chain ID: ${chainId}`);
        console.log("Available chain IDs:", Object.keys(UNISWAP_ADDRESSES));
        process.exit(1);
    }
    
    console.log("Setting addresses:");
    console.log("  Factory:", addresses.factory);
    console.log("  Router:", addresses.router);
    console.log("  USDT:", addresses.usdt);
    
    // Set Uniswap addresses
    const tx = await proxy.setUniswapAddresses(
        addresses.factory,
        addresses.router,
        addresses.usdt
    );
    
    console.log("Transaction hash:", tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    console.log("✅ Uniswap addresses set successfully!");
}

main().catch((error) => {
    console.error("❌ Error:", error);
    process.exitCode = 1;
}); 