`install_dep.sh` is executed by `npm run prepare`, so you don't need to run it manually.
The script will run `npm run prepare` in 2 dependencies: `delphinus-curves` and `web3subscriber`.

# How to run `gen_inputs.ts`
In `zkWasm-protocol`, run:
```
npx hardhat run ./scripts/gen_inputs.ts
```

The command above will generate inputs for the root.

# How to run `mint-token.ts`
In `zkWasm-protocol`, run:
```
npx hardhat run ./scripts/token/mint-token.ts
```

The command above will mint Token's token to the first signer on the Hardhat network.

# How to run `mint-gas.ts`
In `zkWasm-protocol`, run:
```
npx hardhat run ./scripts/token/mint-gas.ts
```

The command above will mint Gas's token to the first signer on the Hardhat network.