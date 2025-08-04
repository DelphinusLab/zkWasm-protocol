const { ethers } = require("hardhat");

// Sepolia configuration
const SEPOLIA_CONFIG = {
    chainId: 11155111,
    initialRoot: "0xcd3f26ca390619d19789d18e2adabfe68f13f959da813b0327683708583d5ede",
    verifierAddress: "0xC1231299bbCAA5786cD0f70624E2A5Cd8b1FB6BB",
    withdrawLimitEther: "1000000000", // 1 billion ETH (will be converted to wei in script)
    uniswap: {
        factory: "0xF62c03E08ada871A0bEb309762E260a7a6a880E6", // Official Uniswap V2 Factory on Sepolia
        router: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3"   // Official Uniswap V2 Router on Sepolia
    },
    usdtDecimals: 18
};

async function main() {
    console.log("🚀 COMPLETE SEPOLIA DEPLOYMENT");
    console.log("=".repeat(60));
    
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying with account: ${deployer.address}`);
    console.log(`Account balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);
    console.log();
    
    // Verify network
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== SEPOLIA_CONFIG.chainId) {
        console.error(`❌ Wrong network! Expected Sepolia (${SEPOLIA_CONFIG.chainId}), got ${network.chainId}`);
        process.exit(1);
    }
    
    console.log("✅ Network: Sepolia Testnet");
    console.log();
    
    let deployedContracts = {};
    
    try {
        // Step 1: Deploy DummyPoints
        console.log("📄 Step 1: Deploying DummyPoints...");
        const DummyPoints = await ethers.getContractFactory("DummyPoints");
        const dummyPoints = await DummyPoints.deploy(
            "Dummy Points",
            "POINTS",
            ethers.utils.parseEther("1000000000") // 1B initial supply
        );
        await dummyPoints.deployed();
        deployedContracts.dummyPoints = dummyPoints.address;
        console.log(`  ✅ DummyPoints deployed: ${dummyPoints.address}`);
        
        // Step 2: Deploy DummyVerifier
        console.log();
        console.log("📄 Step 2: Deploying DummyVerifier...");
        const DummyVerifier = await ethers.getContractFactory("DummyVerifier");
        const dummyVerifier = await DummyVerifier.deploy();
        await dummyVerifier.deployed();
        deployedContracts.dummyVerifier = dummyVerifier.address;
        console.log(`  ✅ DummyVerifier deployed: ${dummyVerifier.address}`);
        
        // Step 3: Deploy Withdraw
        console.log();
        console.log("📄 Step 3: Deploying Withdraw...");
        const Withdraw = await ethers.getContractFactory("Withdraw");
        const withdraw = await Withdraw.deploy();
        await withdraw.deployed();
        deployedContracts.withdraw = withdraw.address;
        console.log(`  ✅ Withdraw deployed: ${withdraw.address}`);
        
        // Step 4: Deploy TokenLaunch
        console.log();
        console.log("📄 Step 4: Deploying TokenLaunch...");
        const TokenLaunch = await ethers.getContractFactory("TokenLaunch");
        const tokenLaunch = await TokenLaunch.deploy();
        await tokenLaunch.deployed();
        deployedContracts.tokenLaunch = tokenLaunch.address;
        console.log(`  ✅ TokenLaunch deployed: ${tokenLaunch.address}`);
        
        // Step 5: Deploy Proxy
        console.log();
        console.log("📄 Step 5: Deploying Proxy...");
        const Proxy = await ethers.getContractFactory("Proxy");
        const proxy = await Proxy.deploy(
            SEPOLIA_CONFIG.chainId,
            SEPOLIA_CONFIG.initialRoot
        );
        await proxy.deployed();
        deployedContracts.proxy = proxy.address;
        console.log(`  ✅ Proxy deployed: ${proxy.address}`);
        
        // Step 6: Deploy DummyUSDT and mint to Proxy
        console.log();
        console.log("📄 Step 6: Deploying DummyUSDT and minting to Proxy...");
        const DummyUSDT = await ethers.getContractFactory("DummyUSDT");
        const dummyUSDT = await DummyUSDT.deploy(
            "Dummy USDT",
            "USDT",
            SEPOLIA_CONFIG.usdtDecimals,
            0 // No initial supply, we'll mint directly to proxy
        );
        await dummyUSDT.deployed();
        deployedContracts.dummyUSDT = dummyUSDT.address;
        console.log(`  ✅ DummyUSDT deployed: ${dummyUSDT.address}`);
        
        // Mint USDT directly to Proxy contract for liquidity operations
        const usdtMintAmount = ethers.utils.parseUnits("1000000000", SEPOLIA_CONFIG.usdtDecimals); // 1B USDT
        let tx = await dummyUSDT.mint(proxy.address, usdtMintAmount);
        await tx.wait();
        console.log(`  ✅ Minted ${ethers.utils.formatUnits(usdtMintAmount, SEPOLIA_CONFIG.usdtDecimals)} USDT to Proxy`);
        
        // Also mint some USDT to deployer for testing
        const deployerUsdtAmount = ethers.utils.parseUnits("100000000", SEPOLIA_CONFIG.usdtDecimals); // 100M USDT
        tx = await dummyUSDT.mint(deployer.address, deployerUsdtAmount);
        await tx.wait();
        console.log(`  ✅ Minted ${ethers.utils.formatUnits(deployerUsdtAmount, SEPOLIA_CONFIG.usdtDecimals)} USDT to deployer`);
        
        console.log();
        console.log("⚙️  CONFIGURING CONTRACTS");
        console.log("=".repeat(40));
        
        // Step 7: Set Settler (use deployer address)
        console.log("🔧 Step 7: Setting Settler...");
        tx = await proxy.setSettler(deployer.address);
        await tx.wait();
        console.log(`  ✅ Settler set: ${deployer.address}`);
        
        // Step 8: Set Verifier
        console.log();
        console.log("🔧 Step 8: Setting Verifier...");
        tx = await proxy.setVerifier(SEPOLIA_CONFIG.verifierAddress);
        await tx.wait();
        console.log(`  ✅ Verifier set: ${SEPOLIA_CONFIG.verifierAddress}`);
        
        // Step 9: Set Withdraw Limit
        console.log();
        console.log("🔧 Step 9: Setting Withdraw Limit...");
        const withdrawLimitWei = ethers.utils.parseEther(SEPOLIA_CONFIG.withdrawLimitEther);
        tx = await proxy.setWithdrawLimit(withdrawLimitWei);
        await tx.wait();
        console.log(`  ✅ Withdraw limit set: ${SEPOLIA_CONFIG.withdrawLimitEther} ETH (${withdrawLimitWei} wei)`);
        
        // Step 10: Add Transactions (Withdraw first, then TokenLaunch)
        console.log();
        console.log("🔧 Step 10: Adding Transactions...");
        
        // Add Withdraw (opcode 0)
        tx = await proxy.addTransaction(withdraw.address, true);
        await tx.wait();
        console.log(`  ✅ Withdraw transaction added (opcode 0): ${withdraw.address}`);
        
        // Add TokenLaunch (opcode 1)
        tx = await proxy.addTransaction(tokenLaunch.address, true);
        await tx.wait();
        console.log(`  ✅ TokenLaunch transaction added (opcode 1): ${tokenLaunch.address}`);
        
        // Step 11: Add Dummy Points Token (index 0)
        console.log();
        console.log("🔧 Step 11: Adding DummyPoints Token...");
        
        // Convert address to uint256 for addToken
        const pointsTokenUint = ethers.BigNumber.from(dummyPoints.address);
        tx = await proxy.addToken(pointsTokenUint);
        await tx.wait();
        console.log(`  ✅ DummyPoints token added at index 0: ${dummyPoints.address}`);
        
        // Step 12: Set Uniswap Addresses
        console.log();
        console.log("🔧 Step 12: Setting Uniswap Addresses...");
        tx = await proxy.setUniswapAddresses(
            SEPOLIA_CONFIG.uniswap.factory,
            SEPOLIA_CONFIG.uniswap.router,
            dummyUSDT.address
        );
        await tx.wait();
        console.log(`  ✅ Uniswap addresses set:`);
        console.log(`    Factory: ${SEPOLIA_CONFIG.uniswap.factory}`);
        console.log(`    Router: ${SEPOLIA_CONFIG.uniswap.router}`);
        console.log(`    USDT: ${dummyUSDT.address}`);
        
        // Step 13: Set USDT Decimals
        console.log();
        console.log("🔧 Step 13: Setting USDT Decimals...");
        tx = await proxy.setUsdtDecimals(SEPOLIA_CONFIG.usdtDecimals);
        await tx.wait();
        console.log(`  ✅ USDT decimals set: ${SEPOLIA_CONFIG.usdtDecimals}`);
        
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
        
        console.log("📋 Configuration Summary:");
        console.log(`  Owner: ${proxyInfo.owner}`);
        console.log(`  Chain ID: ${proxyInfo.chain_id}`);
        console.log(`  Merkle Root: ${proxyInfo.merkle_root}`);
        console.log(`  Token Count: ${proxyInfo.amount_token}`);
        console.log(`  Withdraw Limit: ${await proxy.withdrawLimit()}`);
        console.log();
        console.log("🔗 Transaction Contracts:");
        console.log(`  Opcode 0 (Withdraw): ${withdrawTx}`);
        console.log(`  Opcode 1 (TokenLaunch): ${tokenLaunchTx}`);
        console.log();
        console.log("🪙 Tokens:");
        console.log(`  Index 0 (Points): ${dummyPoints.address}`);
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
        console.log(`export const SEPOLIA_ADDRESSES = {`);
        console.log(`  proxy: "${proxy.address}",`);
        console.log(`  dummyUSDT: "${dummyUSDT.address}",`);
        console.log(`  dummyPoints: "${dummyPoints.address}",`);
        console.log(`  dummyVerifier: "${dummyVerifier.address}",`);
        console.log(`  withdraw: "${withdraw.address}",`);
        console.log(`  tokenLaunch: "${tokenLaunch.address}",`);
        console.log(`  settlerAddress: "${deployer.address}",`);
        console.log(`  verifierAddress: "${SEPOLIA_CONFIG.verifierAddress}"`);
        console.log(`};`);
        
        console.log();
        console.log("🔧 NEXT STEPS:");
        console.log("1. Update scripts/const.ts with the new proxy address");
        console.log("2. Fund the proxy contract with USDT for liquidity operations");
        console.log("3. Test token launch functionality");
        console.log("4. Verify contracts on Etherscan if needed");
        
        console.log();
        console.log("💰 FUNDING INSTRUCTIONS:");
        console.log(`To fund the proxy with USDT for testing:`);
        console.log(`1. Call dummyUSDT.faucet() to get USDT tokens`);
        console.log(`2. Call dummyUSDT.transfer("${proxy.address}", amount) to fund the proxy`);
        console.log(`3. Alternatively, use dummyUSDT.mint("${proxy.address}", amount) as owner`);
        
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