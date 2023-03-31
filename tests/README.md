## How to setup env:
1. Clone both zkWasam-protocol and delphinus-deployment Repos and place these two folder in parallel.
2. Modify confidential config: Fill testChain's relevent confidential configs in `monitor-secrets.json` and `eth-config.ts` in `delphinus-deployment/config`
3. Run `npm install` under `delphinus-deployment`
4. Run `npm install` under `zkWasam-protocol`

## How do deploy testChain
1. Deploy the contracts by running `npx truffle migrate --network ${TESTCHAIN}` under `zkWasam-protocol`
2. If there are some changes in proxy.sol or verify.sol, need to redeploy file2, run `npx truffle migrate --f 2 --to 2 --network ${TESTCHAIN}`
3. Run `node dist/clients/config-contracts-info.js` to generate contract-info to deployment.

## How to run test:
1. Run `npm run test` under `zkWasam-protocol` to test actions
