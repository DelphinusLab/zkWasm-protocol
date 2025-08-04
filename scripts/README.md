# zkWasm Protocol Scripts

This directory contains scripts for setting up and managing the zkWasm Protocol contracts.

## 🚀 Quick Start

### Token Launch Setup (Recommended)
For new deployments, use the comprehensive setup script:

```bash
npm run setup-token-launch
```

This script automatically:
- Detects your network and configures appropriate Uniswap addresses
- Sets correct USDT decimals for your network
- Verifies all configurations
- Provides a summary of the setup

## 📋 Available Scripts

### Core Setup Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Complete Setup** | `npm run setup-token-launch` | 🎯 **Recommended**: Complete Token Launch setup |
| Basic Setup | `npm run setup` | Basic proxy setup (legacy) |

### Token Launch Configuration

| Script | Command | Description |
|--------|---------|-------------|
| Set Uniswap Addresses | `npm run set-uniswap` | Configure Uniswap V2 Factory, Router, and USDT |
| Set USDT Decimals | `npm run set-usdt-decimals` | Configure USDT token decimals |
| Get Configuration | `npm run get-uniswap-config` | 🔍 View current Token Launch config |

### Contract Management

| Script | Command | Description |
|--------|---------|-------------|
| Set Owner | `npm run set-owner` | Change contract owner |
| Set Verifier | `npm run set-verifier` | Set ZK verifier contract |
| Set Settler | `npm run set-settler` | Set settler address |
| Set Merkle Root | `npm run set-root` | Update Merkle root |

### Token & Info

| Script | Command | Description |
|--------|---------|-------------|
| Add Token | `npm run add-token` | Add new token to registry |
| Get Info | `npm run get-info` | View proxy contract info |
| Topup | `npm run topup` | Topup user account |

## 🌐 Supported Networks

The scripts automatically detect your network and use appropriate configurations:

### Mainnet Networks
- **Ethereum Mainnet** (Chain ID: 1)
  - Uniswap V2 Factory/Router
  - USDT: 6 decimals
- **BSC Mainnet** (Chain ID: 56)
  - PancakeSwap V2 Factory/Router
  - USDT: 18 decimals

### Testnet Networks
- **Sepolia** (Chain ID: 11155111)
  - Uniswap V2 on Sepolia
  - Mock USDT: 18 decimals
- **BSC Testnet** (Chain ID: 97)
  - PancakeSwap V2 Testnet
  - Mock USDT: 18 decimals

## 🔧 Configuration Files

### constants.ts
Update `scripts/const.ts` with your deployed contract addresses:

```typescript
export const proxyAddress = "0x...";     // Your Proxy contract
export const verifyAddress = "0x...";    // Your Verifier contract
export const settlerAddress = "0x...";   // Your Settler address
```

## 📖 Usage Examples

### 1. Initial Setup (New Deployment)
```bash
# Deploy contracts first
npx hardhat deploy

# Setup Token Launch functionality
npm run setup-token-launch
```

### 2. Check Current Configuration
```bash
npm run get-uniswap-config
```

Output example:
```
🔍 UNISWAP & USDT CONFIGURATION
==================================================
Network: Chain ID 11155111
Proxy Address: 0xB5a94ca2ad8cb29068492b136A4f23269595Ce57

📍 Uniswap Addresses:
  Factory:  0x7E0987E5b3a30e3f2828572Bb659A548460a3003
  Router:   0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008
  USDT:     0x7169D38820dfd117C3FA1f22a697dBA58d90BA06

✅ Configuration Status:
  Factory:  ✅ Set
  Router:   ✅ Set
  USDT:     ✅ Set

🔢 USDT Configuration:
  Decimals: 18
  Status:   ✅ Valid (18 decimals)
```

### 3. Manual Configuration
If you need to set specific addresses:

```bash
# Set custom Uniswap addresses
npm run set-uniswap

# Set custom USDT decimals
npm run set-usdt-decimals
```

### 4. Contract Management
```bash
# Change owner
npm run set-owner

# Update verifier
npm run set-verifier

# Set settler
npm run set-settler
```

## 🔐 Security Notes

1. **Owner Permissions**: Most scripts require contract owner privileges
2. **Network Detection**: Scripts automatically detect your network from Hardhat config
3. **Address Validation**: All addresses are validated before setting
4. **Transaction Confirmation**: Scripts wait for transaction confirmation

## 🛠️ Development

### Adding New Networks
To add support for a new network, update the `NETWORK_CONFIGS` in:
- `scripts/setup_token_launch.ts`
- `scripts/set_uniswap_addresses.ts`
- `scripts/set_usdt_decimals.ts`

### Script Structure
All scripts follow this pattern:
```typescript
const { ethers } = require("hardhat");
import * as constants from "./const.ts";

async function main() {
    // Script logic here
}

main().catch((error) => {
    console.error("❌ Error:", error);
    process.exitCode = 1;
});
```

## 📞 Support

If you encounter issues:
1. Verify your network configuration in `hardhat.config.ts`
2. Check that contract addresses in `const.ts` are correct
3. Ensure you have sufficient gas and permissions
4. Review the script output for specific error messages

## 🎯 Recommended Workflow

1. **Deploy contracts**: `npx hardhat deploy`
2. **Setup Token Launch**: `npm run setup-token-launch`
3. **Verify setup**: `npm run get-uniswap-config`
4. **Test Token Launch**: Deploy a test project and verify liquidity creation

---

**Ready to launch tokens! 🚀** 