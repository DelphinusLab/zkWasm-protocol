## How to setup env:
1. Make a direcotry like zkWasmEnv. Go to the directory.
2. Clone both zkWsam-protocol and zkWasm-deployment Repos and place these two folder in parallel in the zkWasmEnv.
```
git clone git@github.com:DelphinusLab/zkWasm-deployment.git
git clone git@github.com:DelphinusLab/zkWasm-protocol.git
```
3. Modify confidential config: Fill testChain's relevent confidential configs in `monitor-secrets.json` and `eth-config.ts` in `zkWasm-deployment/config`. You can change the rpcSource of each network in `eth-config.ts` if you are using other rpc source addresses.
4. Run `npm install` under `delphinus-deployment`
5. Run `npm install` under `zkWasam-protocol`
6. If you changed the config in `eth-config.ts` in `zkWasm-deployment/config`, please run `npm prepare` in the `zkWasm-deployment` to make it work.

## How to deploy testChain
1. Deploy the contracts by running `npx truffle migrate --network ${TESTCHAIN}` under `zkWasam-protocol`
2. If there are some changes in proxy.sol or verify.sol, need to redeploy migration file 2, run `npx truffle migrate --f 2 --to 2 --network ${TESTCHAIN}`
3. Run `node dist/clients/config-contracts-info.js` to generate contract-info to deployment under `zkWasam-protocol`.

# How to use the `token` directory
1. Run `node mint-gas.js sepolia <metamask address>` where `metamask address` is your MetaMask wallet address after typing 'sepolia' to mint Gas's token to wallet.
2. Run `node mint-token.js sepolia <metamask address>` where `metamask address` is your MetaMask wallet address to mint Token's token to wallet.

# How to run `deposit_withdraw_test.ts`
1. If it is the first time to deploy contract.
In `zkWasm-protocol`, run:
```
npx tsc
npx truffle migrate --network ${TESTCHAIN}
node dist/src/clients/config-contracts-info.js
node dist/tests/prepare_test.js ${TESTCHAIN}
node dist/tests/deposit_withdraw_test.js ${TESTCHAIN}
```
This will do:
    1. Compile new changs to js.
    2. Deploy all the contracts to the network.
    3. Copy the new deployed contracts' addresses to zkWasm-deployment.
    4. Add test tokens to the monitor account which configured in zkWasm-deployment config files.
    5. Do the deposit and withdraw tests.

2. If it is not the first time to deploy contract
In `zkWasm-protocol`, run:
```
npx tsc
npx truffle migrate --f 2 --to 2 --network ${TESTCHAIN}
node dist/src/clients/config-contracts-info.js
node dist/tests/prepare_test.js ${TESTCHAIN}
node dist/tests/deposit_withdraw_test.js ${TESTCHAIN}
```
This will do:
    1. Compile new changs to js.
    2. Deploy the Proxy and DummyVerifier contracts to the network.
    3. Copy the new deployed contracts' addresses to zkWasm-deployment.
    4. Add test tokens to the monitor account which configured in zkWasm-deployment config files.
    5. Do the deposit and withdraw tests.

Notes:
Running commands above will generate artifacts in `zkWasm-protocol/build` and `contracts-info.json` in `zkWasm-deployment`

# How to run `gen_inputs.ts`
1. If it is the first time to deploy contract
In `zkWasm-protocol`, run:
```
npx tsc
npx truffle migrate --network ${TESTCHAIN}
node dist/src/clients/config-contracts-info.js
node dist/tests/gen_inputs.js ${TESTCHAIN}
```

2. If it is not the first time to deploy contract
In `zkWasm-protocol`, run:
```
npx tsc
npx truffle migrate --f 2 --to 2 --network ${TESTCHAIN}
node dist/src/clients/config-contracts-info.js
node dist/tests/gen_input.js ${TESTCHAIN}
```

Running commands above will generate artifacts in `zkWasm-protocol/build` and `contracts-info.json` in `zkWasm-deployment`
