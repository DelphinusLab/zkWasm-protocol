const { ethers } = require("hardhat");
import * as constants from "./const.ts";

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
            factory: "0xF62c03E08ada871A0bEb309762E260a7a6a880E6",
            router: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3",
            usdt: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06" // Your deployed DummyUSDT
        },
        usdtDecimals: 18
    },
    // BNB Chain (BSC) - Official Uniswap V2 deployment
    56: {
        name: "BNB Chain",
        uniswap: {
            factory: "0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6",
            router: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
            usdt: "0x55d398326f99059fF775485246999027B3197955"
        },
        usdtDecimals: 18
    },
    // Arbitrum One
    42161: {
        name: "Arbitrum One",
        uniswap: {
            factory: "0xf1D7CC64Fb4452F05c498126312eBE29f30Fbcf9",
            router: "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
            usdt: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" // USDT on Arbitrum
        },
        usdtDecimals: 6
    },
    // Optimism
    10: {
        name: "Optimism",
        uniswap: {
            factory: "0x0c3c1c532F1e39EdF36BE9Fe0bE1410313E074Bf",
            router: "0x4A7b5Da61326A6379179b40d00F57E5bbDC962c2",
            usdt: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58" // USDT on Optimism
        },
        usdtDecimals: 6
    },
    // Polygon
    137: {
        name: "Polygon",
        uniswap: {
            factory: "0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C",
            router: "0xedf6066a2b290C185783862C7F4776A2C8077AD1",
            usdt: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" // USDT on Polygon
        },
        usdtDecimals: 6
    },
    // Base
    8453: {
        name: "Base",
        uniswap: {
            factory: "0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6",
            router: "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
            usdt: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2" // USDT on Base
        },
        usdtDecimals: 6
    },
    // Avalanche C-Chain
    43114: {
        name: "Avalanche",
        uniswap: {
            factory: "0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C",
            router: "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
            usdt: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7" // USDT on Avalanche
        },
        usdtDecimals: 6
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
        
    } catch (error) {
        console.error("❌ Error checking owner:", error.message);
        process.exit(1);
    }
    
    // Step 1: Set Uniswap addresses
    console.log("📍 Step 1: Setting Uniswap addresses...");
    console.log(`  Factory: ${config.uniswap.factory}`);
    console.log(`  Router:  ${config.uniswap.router}`);
    console.log(`  USDT:    ${config.uniswap.usdt}`);
    
    try {
        const tx1 = await proxy.setUniswapAddresses(
            config.uniswap.factory,
            config.uniswap.router,
            config.uniswap.usdt
        );
        
        console.log(`  Transaction: ${tx1.hash}`);
        const receipt1 = await tx1.wait();
        console.log(`  ✅ Confirmed in block ${receipt1.blockNumber}`);
        console.log(`  Gas used: ${receipt1.gasUsed.toString()}`);
        
    } catch (error) {
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
        
    } catch (error) {
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
            
        } else {
            console.error("❌ Configuration verification failed!");
            process.exit(1);
        }
        
    } catch (error) {
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