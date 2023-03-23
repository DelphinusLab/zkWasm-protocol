if [ ! -z $1 ]
then
    TESTCHAIN=$1
else
    TESTCHAIN="goerli"
fi

echo "Test on Chain: $TESTCHAIN"

npx truffle migrate --f 2 --to 2 --network ${TESTCHAIN}
node dist/tests/init_BlockHeight.js ${TESTCHAIN}
node dist/clients/config-contracts-info.js
node dist/tests/action_test.js addpool ${TESTCHAIN}
node dist/tests/action_test.js deposit ${TESTCHAIN}
node dist/tests/action_test.js retrive ${TESTCHAIN}
node dist/tests/action_test.js setkey ${TESTCHAIN}
node dist/tests/action_test.js supply ${TESTCHAIN}
node dist/tests/action_test.js swap ${TESTCHAIN}
node dist/tests/action_test.js withdraw ${TESTCHAIN}
node dist/tests/monitorTestAckEvent.js ${TESTCHAIN}
