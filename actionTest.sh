if [ ! -z $1 ]
then
    TESTCHAIN=$1
else
    TESTCHAIN="goerli"
fi

# If there are changes in proxy.sol or verify.sol, need to redeploy file2
# npx truffle migrate --f 2 --to 2 --network ${TESTCHAIN}
# If there are more changes other than proxy.sol and verify.sol, need to re-deploy all
# npx truffle migrate --network ${TESTCHAIN}
read -r -p "The PROXY contract address in PROXY.json is for test purpose only and verifier is Dummy. Are you sure to proceed? [y/N] " response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]
then
    node dist/clients/config-contracts-info.js
    node dist/tests/action_test.js addpool ${TESTCHAIN}
    node dist/tests/action_test.js deposit ${TESTCHAIN}
    node dist/tests/action_test.js retrive ${TESTCHAIN}
    node dist/tests/action_test.js setkey ${TESTCHAIN}
    node dist/tests/action_test.js supply ${TESTCHAIN}
    node dist/tests/action_test.js swap ${TESTCHAIN}
    node dist/tests/action_test.js withdraw ${TESTCHAIN}
    node dist/tests/depositWithdrawTest.js ${TESTCHAIN}
else
    exit 0
fi