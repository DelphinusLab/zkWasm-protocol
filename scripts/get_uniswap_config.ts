const { ethers } = require("hardhat");
import * as constants from "./const.ts";

async function main() {
    const proxy = await ethers.getContractAt("Proxy", constants.proxyAddress);
    
    // Get current network
    const network = await ethers.provider.getNetwork();
    const chainId = network.chainId;
    
    console.log("=".repeat(50));
    console.log("🔍 UNISWAP & USDT CONFIGURATION");
    console.log("=".repeat(50));
    console.log(`Network: Chain ID ${chainId}`);
    console.log(`Proxy Address: ${constants.proxyAddress}`);
    console.log();
    
    try {
        // Get Uniswap addresses
        console.log("📍 Uniswap Addresses:");
        const factory = await proxy.uniswapV2Factory();
        const router = await proxy.uniswapV2Router();
        const usdt = await proxy.usdtToken();
        
        console.log(`  Factory:  ${factory}`);
        console.log(`  Router:   ${router}`);
        console.log(`  USDT:     ${usdt}`);
        
        // Check if addresses are set (not zero address)
        const zeroAddress = "0x0000000000000000000000000000000000000000";
        const factorySet = factory !== zeroAddress;
        const routerSet = router !== zeroAddress;
        const usdtSet = usdt !== zeroAddress;
        
        console.log();
        console.log("✅ Configuration Status:");
        console.log(`  Factory:  ${factorySet ? "✅ Set" : "❌ Not set"}`);
        console.log(`  Router:   ${routerSet ? "✅ Set" : "❌ Not set"}`);
        console.log(`  USDT:     ${usdtSet ? "✅ Set" : "❌ Not set"}`);
        
    } catch (error) {
        console.log("❌ Error reading Uniswap addresses:", error.message);
    }
    
    try {
        // Get USDT decimals
        console.log();
        console.log("🔢 USDT Configuration:");
        const decimals = await proxy.usdtDecimals();
        console.log(`  Decimals: ${decimals}`);
        
        // Validate decimals
        if (decimals > 0 && decimals <= 18) {
            console.log(`  Status:   ✅ Valid (${decimals} decimals)`);
        } else {
            console.log(`  Status:   ❌ Invalid (should be 1-18)`);
        }
        
    } catch (error) {
        console.log("❌ Error reading USDT decimals:", error.message);
    }
    
    try {
        // Get additional proxy info
        console.log();
        console.log("ℹ️  Additional Info:");
        const proxyInfo = await proxy.getProxyInfo();
        console.log(`  Owner:        ${proxyInfo.owner}`);
        console.log(`  Chain ID:     ${proxyInfo.chain_id}`);
        console.log(`  Token Count:  ${proxyInfo.amount_token}`);
        console.log(`  Merkle Root:  ${proxyInfo.merkle_root}`);
        
    } catch (error) {
        console.log("❌ Error reading proxy info:", error.message);
    }
    
    // Check if USDT token contract exists (if address is set)
    try {
        const usdtAddress = await proxy.usdtToken();
        if (usdtAddress !== "0x0000000000000000000000000000000000000000") {
            console.log();
            console.log("🪙 USDT Token Contract:");
            
            // Try to get token info
            const usdtContract = await ethers.getContractAt("IERC20", usdtAddress);
            
            try {
                const name = await usdtContract.name();
                const symbol = await usdtContract.symbol();
                const decimals = await usdtContract.decimals();
                
                console.log(`  Name:     ${name}`);
                console.log(`  Symbol:   ${symbol}`);
                console.log(`  Decimals: ${decimals}`);
                console.log(`  Status:   ✅ Contract accessible`);
                
            } catch (tokenError) {
                console.log(`  Status:   ❌ Contract not accessible or not ERC20`);
                console.log(`  Error:    ${tokenError.message}`);
            }
        }
        
    } catch (error) {
        console.log("❌ Error checking USDT contract:", error.message);
    }
    
    console.log();
    console.log("=".repeat(50));
}

main().catch((error) => {
    console.error("❌ Error:", error);
    process.exitCode = 1;
}); 