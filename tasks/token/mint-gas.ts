import { TxBinder } from "web3subscriber/src/txbinder";
import { Gas } from "../../typechain-types";

async function main(targetAccount: string) {
  let txbinder = new TxBinder();

  // Get the deployer account
  const { deployer } = await getNamedAccounts();

  // Get the Gas contract
  const gas = await ethers.getContract<Gas>("Gas", deployer);

  // Get the address of the Token contract
  const gasAddress = await gas.getAddress();

  try {
    // Bind a callback to the snapshot event
    txbinder.register_snapshot("Mint", () => {
      console.log("Mint snapshot");
    });

    // Bind some callbacks to the Verify action
    txbinder
      .when("mint", "transactionHash", (txResponse) => {
        console.log("Get transactionHash", txResponse);
      });

    // call the callback when the snapshot event is emitted
    txbinder.snapshot("Mint");

    console.log("mint gas:", gasAddress);
    let balance = await gas.balanceOf(deployer);
    console.log("sender: balance before mint:", balance);    

    // Bind the transaction method to an action name
    let r = await txbinder.execute("mint", () => {
      // Execute some transaction which returns a TransactionResponse
      return gas.mint(BigInt("10000000000000000000"));
    });

    balance = await gas.balanceOf(deployer);
    console.log("sender: balance after mint:", balance);

    // Bind the transaction method to an action name
    await txbinder.execute("transfer", () => {
      // Execute some transaction which returns a TransactionResponse
      return gas.transfer(targetAccount, BigInt("10000000000000000000"))
    });
    balance = await gas.balanceOf(targetAccount);
    console.log("balance of recipient after transfer", balance);
  } catch (err) {
    console.log("%s", err);
  }
}

task("mintGas", "Mint Gas's token to wallet")
  .addParam("targetaccount", "The MetaMask wallet address")
  .setAction(async ({ targetaccount }) => {
    await main(targetaccount);
  });