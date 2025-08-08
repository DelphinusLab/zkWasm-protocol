import { HardhatUserConfig } from "hardhat/config";
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Import tasks
//import './tasks/token/mint-gas';
//import './tasks/token/mint-token';

// Get private keys from environment variables
// Priority: process.env > hardhat vars
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY || (() => {
    try {
        const { vars } = require("hardhat/config");
        return vars.get("SEPOLIA_PRIVATE_KEY");
    } catch (error) {
        console.warn("⚠️  No SEPOLIA_PRIVATE_KEY found in environment or hardhat vars");
        return undefined;
    }
})();

const BSC_PRIVATE_KEY = process.env.BSC_PRIVATE_KEY || (() => {
    try {
        const { vars } = require("hardhat/config");
        return vars.get("BSC_PRIVATE_KEY");
    } catch (error) {
        console.warn("⚠️  No BSC_PRIVATE_KEY found in environment or hardhat vars");
        return undefined;
    }
})();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,  // Lower runs = smaller contract size, higher gas cost
        details: {
          yul: true,
          yulDetails: {
            stackAllocation: true,
            optimizerSteps: "dhfoDgvulfnTUtnIf"  // Default optimization sequence
          }
        }
      },
      viaIR: false  // Set to true for even more optimization (but slower compilation)
    }
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: SEPOLIA_PRIVATE_KEY ? [SEPOLIA_PRIVATE_KEY] : [],
      gas: 6000000,
      gasPrice: 30000000000, // 30 gwei for faster confirmation
      timeout: 120000, // 2 minutes timeout
    },
    bsc: {
      url: process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org/",
      accounts: BSC_PRIVATE_KEY ? [BSC_PRIVATE_KEY] : [],
      gas: 6000000,
      gasPrice: 5000000000, // 5 gwei (BSC typically uses lower gas prices)
      timeout: 120000, // 2 minutes timeout
      chainId: 56
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts: BSC_PRIVATE_KEY ? [BSC_PRIVATE_KEY] : [],
      gas: 6000000,
      gasPrice: 10000000000, // 10 gwei for testnet
      timeout: 120000,
      chainId: 97
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};

export default config;
