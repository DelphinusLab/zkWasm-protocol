const { ethers } = require("hardhat");

// BSC Mainnet configuration
const BSC_CONFIG = {
    chainId: 56,
    initialRoot: "0xcd3f26ca390619d19789d18e2adabfe68f13f959da813b0327683708583d5ede",
    verifierAddress: "0xcecd1abb92c6b928b9bf4239b51429aad6ae1ccc",
    settlerAddress: "0x4693728B330285A90e9355eB4e2C22fc01eadE76",
    withdrawLimitEther: "10000000", // 10 million ETH (will be converted to wei in script)
    pointsToken: "0xa8d3dee6671c4fdac4743a1eb1F276EabD4ba302",
    usdtToken: "0x55d398326f99059fF775485246999027B3197955",
    uniswap: {
        factory: "0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6",
        router: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24"
    },
    usdtDecimals: 18
};

async function main() {
    console.log("🚀 COMPLETE BSC MAINNET DEPLOYMENT");
    console.log("=".repeat(60));
    
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying with account: ${deployer.address}`);
    console.log(`Account balance: ${ethers.utils.formatEther(await deployer.getBalance())} BNB`);
    console.log();
    
    // Verify network
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== BSC_CONFIG.chainId) {
        console.error(`❌ Wrong network! Expected BSC Mainnet (${BSC_CONFIG.chainId}), got ${network.chainId}`);
        process.exit(1);
    }
    
    console.log("✅ Network: BSC Mainnet");
    console.log();
    
    let deployedContracts: any = {};
    
    try {
        // Step 1: Deploy Withdraw
        console.log("📄 Step 1: Deploying Withdraw...");
        const Withdraw = await ethers.getContractFactory("Withdraw");
        const withdraw = await Withdraw.deploy();
        await withdraw.deployed();
        deployedContracts.withdraw = withdraw.address;
        console.log(`  ✅ Withdraw deployed: ${withdraw.address}`);
        
        // Step 2: Deploy TokenLaunch
        console.log();
        console.log("📄 Step 2: Deploying TokenLaunch...");
        const TokenLaunch = await ethers.getContractFactory("TokenLaunch");
        const tokenLaunch = await TokenLaunch.deploy();
        await tokenLaunch.deployed();
        deployedContracts.tokenLaunch = tokenLaunch.address;
        console.log(`  ✅ TokenLaunch deployed: ${tokenLaunch.address}`);
        
        // Step 3: Deploy Proxy
        console.log();
        console.log("📄 Step 3: Deploying Proxy...");
        const Proxy = await ethers.getContractFactory("Proxy");
        const proxy = await Proxy.deploy(
            BSC_CONFIG.chainId,
            BSC_CONFIG.initialRoot
        );
        await proxy.deployed();
        deployedContracts.proxy = proxy.address;
        console.log(`  ✅ Proxy deployed: ${proxy.address}`);
        
        console.log();
        console.log("⚙️  CONFIGURING CONTRACTS");
        console.log("=".repeat(40));
        
        // Step 4: Set Settler
        console.log("🔧 Step 4: Setting Settler...");
        let tx = await proxy.setSettler(BSC_CONFIG.settlerAddress);
        await tx.wait();
        console.log(`  ✅ Settler set: ${BSC_CONFIG.settlerAddress}`);
        
        // Step 5: Set Verifier
        console.log();
        console.log("🔧 Step 5: Setting Verifier...");
        tx = await proxy.setVerifier(BSC_CONFIG.verifierAddress);
        await tx.wait();
        console.log(`  ✅ Verifier set: ${BSC_CONFIG.verifierAddress}`);
        
        // Step 6: Set Withdraw Limit
        console.log();
        console.log("🔧 Step 6: Setting Withdraw Limit...");
        const withdrawLimitWei = ethers.utils.parseEther(BSC_CONFIG.withdrawLimitEther);
        tx = await proxy.setWithdrawLimit(withdrawLimitWei);
        await tx.wait();
        console.log(`  ✅ Withdraw limit set: ${BSC_CONFIG.withdrawLimitEther} ETH (${withdrawLimitWei} wei)`);
        
        // Step 7: Add Transactions (Withdraw first, then TokenLaunch)
        console.log();
        console.log("🔧 Step 7: Adding Transactions...");
        
        // Add Withdraw (opcode 0)
        tx = await proxy.addTransaction(withdraw.address, true);
        await tx.wait();
        console.log(`  ✅ Withdraw transaction added (opcode 0): ${withdraw.address}`);
        
        // Add TokenLaunch (opcode 1)
        tx = await proxy.addTransaction(tokenLaunch.address, true);
        await tx.wait();
        console.log(`  ✅ TokenLaunch transaction added (opcode 1): ${tokenLaunch.address}`);
        
        // Step 8: Add POINTS Token (index 0)
        console.log();
        console.log("🔧 Step 8: Adding POINTS Token...");
        
        // Correctly format token UID with chain_id: UID = (chain_id << 160) | address
        const chainId = BSC_CONFIG.chainId; // 56
        const pointsAddress = BSC_CONFIG.pointsToken;
        const pointsTokenUid = ethers.BigNumber.from(chainId).shl(160).or(ethers.BigNumber.from(pointsAddress));
        
        tx = await proxy.addToken(pointsTokenUid);
        await tx.wait();
        console.log(`  ✅ POINTS token added at index 0: ${pointsAddress}`);
        console.log(`  📋 Token UID: ${pointsTokenUid.toHexString()}`);
        
        // Step 9: Set Uniswap Addresses
        console.log();
        console.log("🔧 Step 9: Setting Uniswap Addresses...");
        tx = await proxy.setUniswapAddresses(
            BSC_CONFIG.uniswap.factory,
            BSC_CONFIG.uniswap.router,
            BSC_CONFIG.usdtToken
        );
        await tx.wait();
        console.log(`  ✅ Uniswap addresses set:`);
        console.log(`    Factory: ${BSC_CONFIG.uniswap.factory}`);
        console.log(`    Router: ${BSC_CONFIG.uniswap.router}`);
        console.log(`    USDT: ${BSC_CONFIG.usdtToken}`);
        
        // Step 10: Set USDT Decimals
        console.log();
        console.log("🔧 Step 10: Setting USDT Decimals...");
        tx = await proxy.setUsdtDecimals(BSC_CONFIG.usdtDecimals);
        await tx.wait();
        console.log(`  ✅ USDT decimals set: ${BSC_CONFIG.usdtDecimals}`);
        
        console.log();
        console.log("🔍 VERIFICATION");
        console.log("=".repeat(30));
        
        // Verify configuration
        const proxyInfo = await proxy.getProxyInfo();
        const factory = await proxy.uniswapV2Factory();
        const router = await proxy.uniswapV2Router();
        const usdt = await proxy.usdtToken();
        const decimals = await proxy.usdtDecimals();
        const withdrawTx = await proxy._get_transaction(0);
        const tokenLaunchTx = await proxy._get_transaction(1);
        const pointsToken = await proxy._tokens(0);
        const settler = await proxy.settler();
        const verifier = await proxy.verifier();
        
        console.log("📋 Configuration Summary:");
        console.log(`  Owner: ${proxyInfo.owner}`);
        console.log(`  Chain ID: ${proxyInfo.chain_id}`);
        console.log(`  Merkle Root: ${proxyInfo.merkle_root}`);
        console.log(`  Token Count: ${proxyInfo.amount_token}`);
        console.log(`  Withdraw Limit: ${await proxy.withdrawLimit()}`);
        console.log(`  Settler: ${settler}`);
        console.log(`  Verifier: ${verifier}`);
        console.log();
        console.log("🔗 Transaction Contracts:");
        console.log(`  Opcode 0 (Withdraw): ${withdrawTx}`);
        console.log(`  Opcode 1 (TokenLaunch): ${tokenLaunchTx}`);
        console.log();
        console.log("🪙 Tokens:");
        console.log(`  Index 0 (POINTS):`);
        console.log(`    Address: ${BSC_CONFIG.pointsToken}`);
        console.log(`    UID: ${pointsToken.token_uid}`);
        console.log(`    Chain ID from UID: ${ethers.BigNumber.from(pointsToken.token_uid).shr(160)}`);
        console.log();
        console.log("🏪 Uniswap Configuration:");
        console.log(`  Factory: ${factory}`);
        console.log(`  Router: ${router}`);
        console.log(`  USDT: ${usdt}`);
        console.log(`  USDT Decimals: ${decimals}`);
        
        console.log();
        console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
        console.log("=".repeat(60));
        
        // Generate deployment summary
        console.log("📄 DEPLOYMENT ADDRESSES:");
        console.log(`export const BSC_ADDRESSES = {`);
        console.log(`  proxy: "${proxy.address}",`);
        console.log(`  pointsToken: "${BSC_CONFIG.pointsToken}",`);
        console.log(`  usdtToken: "${BSC_CONFIG.usdtToken}",`);
        console.log(`  withdraw: "${withdraw.address}",`);
        console.log(`  tokenLaunch: "${tokenLaunch.address}",`);
        console.log(`  settlerAddress: "${BSC_CONFIG.settlerAddress}",`);
        console.log(`  verifierAddress: "${BSC_CONFIG.verifierAddress}",`);
        console.log(`  uniswapFactory: "${BSC_CONFIG.uniswap.factory}",`);
        console.log(`  uniswapRouter: "${BSC_CONFIG.uniswap.router}"`);
        console.log(`};`);
        
        console.log();
        console.log("🔧 NEXT STEPS:");
        console.log("1. Update scripts/const.ts with the new proxy address");
        console.log("2. Test withdraw points functionality");
        console.log("3. Test token launch functionality");
        console.log("4. Verify contracts on BscScan if needed");
        
        console.log();
        console.log("✅ BSC MAINNET CONFIGURATION:");
        console.log("- Using existing POINTS token: 0xa8d3dee6671c4fdac4743a1eb1F276EabD4ba302");
        console.log("- Using existing USDT token: 0x55d398326f99059fF775485246999027B3197955");
        console.log("- Using PancakeSwap V2 Factory and Router");
        console.log("- Configured for 10M ETH withdraw limit");
        console.log("- Settler and Verifier addresses set as requested");
        
        console.log();
        console.log("🔧 TOKEN CONFIGURATION:");
        console.log("- Token Index 0 (POINTS) configured with correct UID and chain_id");
        console.log("- _is_local check should pass for withdraw points operations");
        console.log("- Ready for token launch operations with Uniswap V2 integration");
        
    } catch (error) {
        console.error("❌ Deployment failed:", error);
        console.log();
        console.log("📄 Partial deployment addresses (if any):");
        for (const [name, address] of Object.entries(deployedContracts)) {
            console.log(`  ${name}: ${address}`);
        }
        process.exit(1);
    }
}

main().catch((error) => {
    console.error("❌ Script failed:", error);
    process.exitCode = 1;
});