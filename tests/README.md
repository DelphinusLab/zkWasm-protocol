## How do deploy testChain
1. Deploy the contracts by running `npx truffle migrate --network ${TESTCHAIN}`
2. If there are some changes in proxy.sol or verify.sol, need to redeploy file2, run `npx truffle migrate --f 2 --to 2 --network ${TESTCHAIN}`
3. Run `node dist/clients/config-contracts-info.js` to generate contract-info to deployment.

## How to use:
1. Clone both zkWasam-protocol and delphinus-deployment Repos and place these two folder in parallel.
2. Modify confidential config: Fill testChain's relevent confidential configs in `monitor-secrets.json` and `eth-config.ts` in `delphinus-deployment/config`
3. Run `npm install` under `delphinus-deployment`
3. Run `npm install` under `zkWasam-protocol`
4. Run `npm run test` under `zkWasam-protocol` to test actions

### Attentions:
1. Contracts had deployed on goerli, so you don't need to re-deploy contracts normally, unless constracts changed or needs to be tested on a different chain, please modify the truffle migration part in `action_test.sh`
2. If all the Dependencies' Repo has been  installed, you can run `sh action_test.sh` to test actions directly. (The default testChain is goerli).
2. Or you can run `sh action_test.sh {testChain}` to test actions on a chosen testChain (example: sh action_test.sh bsctestnet)
