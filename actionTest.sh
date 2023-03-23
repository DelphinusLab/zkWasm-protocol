if [ ! -z $1 ]
then
    TESTCHAIN=$1
else
    TESTCHAIN="goerli"
fi

# If there are changes in proxy.sol or verify.sol, need to redeploy
# npx truffle migrate --f 2 --to 2 --network ${TESTCHAIN}

# node dist/clients/config-contracts-info.js
# node dist/tests/action_test.js addpool ${TESTCHAIN}
# node dist/tests/action_test.js deposit ${TESTCHAIN}
# node dist/tests/action_test.js retrive ${TESTCHAIN}
# node dist/tests/action_test.js setkey ${TESTCHAIN}
# node dist/tests/action_test.js supply ${TESTCHAIN}
# node dist/tests/action_test.js swap ${TESTCHAIN}
# node dist/tests/action_test.js withdraw ${TESTCHAIN}