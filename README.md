# zkWasm-protocol
## transaction format
### Each transaction has 80 bytes in total

- op: 1 byte
- nonce: 7 bytes
- args: 72 bytes

### Commands Structure
- common struct: accountIndex(4 bytes) objectIndex(4 bytes)
- opcode: enum { deposit, withdraw, ... }

## How to use
### Install dependencies
Run `npm install`.

The dependencies and devDependencies will be installed, and the prepare script will be run, before the package is packaged and installed.

### Compile contracts
Run `npm run compile`.

The command will generate directories:
- `artifacts`: The directory where the compilation artifacts are stored.
- `typechain-types`: contains TypeScript bindings for smart contracts.
- `cache`: The directory used by Hardhat to cache its internal stuff.

### Deploy smart contracts
Take `sepolia` for example.

#### Add new network
If you want to add network, add configuration in `config.networks` field in `hardhat.config.ts`.
```
sepolia: {
  url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
  accounts: [SEPOLIA_PRIVATE_KEY],
},
```

1. The `sepolia` is the network name.

2. There are two fields in `sepolia`:
- `url`: The url of the node. This argument is required for custom networks.
- `accounts` This field controls which accounts Hardhat uses. It can use the node's accounts (by setting it to "remote"), a list of local accounts (by setting it to an array of hex-encoded private keys), or use an HD Wallet. Here is the array  of private keys.

You can add more fields according to [the document](https://hardhat.org/hardhat-runner/docs/config).

3. `INFURA_API_KEY` and `SEPOLIA_PRIVATE_KEY` are configuration variables. They are getting before the configuration by `const INFURA_API_KEY = vars.get("INFURA_API_KEY");` and `const SEPOLIA_PRIVATE_KEY = vars.get("SEPOLIA_PRIVATE_KEY");` in `hardhat.config.ts`.

You can set your own configuration variables with `vars.get`.

#### Assigns values to the configuration variables
Assume `c123456d3aab45a4b692739e7d4811bc` is your Infura API key and `0xe1336538174201795c5b0b4a90123456c060386751684c0ce8eefa003e312345` is your private key.

In `zkWasm-protocol`, run:
```
npx hardhat vars set INFURA_API_KEY c123456d3aab45a4b692739e7d4811bc
npx hardhat vars set SEPOLIA_PRIVATE_KEY 0xe1336538174201795c5b0b4a90123456c060386751684c0ce8eefa003e312345
```

#### Deploy
1. Deploy the contracts by running `npm run deploy -- --network sepolia` under `zkWasam-protocol`.

- If you run the command again, the contracts will not be redeployed unless the deploy script or the contract code change.
- Run `npm run deploy -- --network sepolia --reset` to resets the deployments from scratch. Previously deployed contracts are not considered and deleted from disk.
- The `deploy` folder is expected to contain the deploy scripts that are executed upon invocation of hardhat deploy or hardhat node. It can also be an array of folder path.
- The `deployments` folder will contain the resulting deployments (contract addresses along their abi, bytecode, metadata...). One folder per network and one file per contract.

2. If there are some changes in `Proxy.sol` or `Verify.sol`, redeploy `deploy/002_deploy_bridge.ts` with `npm run deploy -- --network sepolia --tags DeployBridge`.

- The `DeployBridge` tag is set in `002_deploy_bridge.ts`.
- The command will execute only the scripts containing all the tags.
- If there are multiple tags in `002_deploy_bridge.ts`, run the command with `--tags tags1,tags2...`.

### How to use `scripts` folder
- `install_dep.sh` is executed by `npm run prepare`, so you don't need to run it manually. It will run `npm install` in `delphinus-curves` and `web3subscriber`.
- `gen_inputs.ts`
In `zkWasm-protocol`, run `npm run runScript ./scripts/gen_inputs.ts` to generate  publicInputsBytes and privateInputsBytes for the root.

### How to run the `test` directory
Please run tests after deploying contracts because tests reuse previously deployed contracts. Run `npm run test -- --network localhost`.

- `prepare_tests.ts` and `tests_utils.ts` contains helper funtions for testing.
- `set_verifier_tests.ts` and `deposit_withdraw_test.ts` contains tests.

### How to use the `token` directory
The <metamask address> is your MetaMask wallet address to mint Token's token to wallet.

1. Run `npm run mintToken -- --targetaccount <metamask address> --network sepolia` to mint Token's token to wallet.

2. Run `npm run mintGas -- --targetaccount <metamask address> --network sepolia` to mint Gas's token to wallet.

## Test on localhsot
1. Run `npx hardhat node` in a terminal to have a persistent instance of the hardhat network.
2. In another terminal, run commands above with `localhost` rather than `sepolia`.