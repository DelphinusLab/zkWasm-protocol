import { HardhatUserConfig } from "hardhat/config";
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Import tasks
//import './tasks/token/mint-gas';
//import './tasks/token/mint-token';

// Get private key from environment variables
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
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};

export default config;
