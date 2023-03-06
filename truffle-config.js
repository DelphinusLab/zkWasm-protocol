/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * trufflesuite.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

const Web3HttpProvider = require('web3-providers-http');

const HDWalletProvider = require('@truffle/hdwallet-provider');
const secrets = require('delphinus-deployment/config/monitor-secrets.json');

const http_options = {
        keepAlive: true,
        timeout: 20000, // milliseconds,
        headers: [{name: 'Access-Control-Allow-Origin', value: '*'}],
        withCredentials: false
};

const http_provider = (url) => {
    let p = new Web3HttpProvider(url, http_options);
    return p;
}

module.exports = {
  /**
   * $ truffle test --network <network-name>
   */

  networks: {
    goerli: { //eth testnet
      provider: () => new HDWalletProvider(secrets.accounts.deployer.priv,
        http_provider("https://goerli.infura.io/v3/" + secrets.infura_id_goerli) //we find ankr does not stable for deployment so have to use infura
        //http_provider("https://eth.getblock.io/goerli/?api_key=" + secrets.getblock_key_goerli)
      ),
      network_id: 5,       // goerli's id
      gas: 5500000,        // goerli has a lower block limit than mainnet
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 400,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },
    bsctestnet: { //bsc
      provider: () => new HDWalletProvider(secrets.accounts.deployer.priv,
        http_provider(`https://data-seed-prebsc-1-s3.binance.org:8545`)
        //http_provider("https://bsc.getblock.io/testnet/?api_key="+secrets.getblock_key)
      ),
      network_id: 97,
      confirmations: 10,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    cantotestnet: {
      provider: () => new HDWalletProvider(secrets.accounts.deployer.priv,
        http_provider("https://eth.plexnode.wtf/")),
      network_id: 740,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    rolluxtestnet: {
      provider: () => new HDWalletProvider(secrets.accounts.deployer.priv,
        http_provider("https://testnet.rollux.com:2814/")),
      network_id: 2814,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "native",    // Fetch exact version from solc-bin (default: truffle's version)
      settings: {
        optimizer: {
          enabled: true,
          runs: 10,
        },
      },
    },
  },

  // Note: if you migrated your contracts prior to enabling this field in your Truffle project and want
  // those previously migrated contracts available in the .db directory, you will need to run the following:
  // $ truffle migrate --reset --compile-all

  db: {
    enabled: false
  }
};
