import BN from 'bn.js';
import { TxBinder } from "web3subscriber/src/txbinder";
import { ethers } from "hardhat";

async function main() {
  let txbinder = new TxBinder();

  // Deploy the Token contract
  const gas = await ethers.deployContract("Gas");

  // Get the address of the Token contract
  const gasAddress = await gas.getAddress();

  // Get the owner and otherAccount from the hardhat node
  const [owner, otherAccount] = await ethers.getSigners();

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
    let balance = await gas.balanceOf(owner.address);
    console.log("sender: balance before mint:", balance);

    // Bind the transaction method to an action name
    let r = await txbinder.execute("mint", () => {
      // Execute some transaction which returns a TransactionResponse
      return gas.mint(BigInt("10000000000000000000"));
    });

    balance = await gas.balanceOf(owner.address);
    console.log("sender: balance after mint:", balance);

    // Bind the transaction method to an action name
    await txbinder.execute("transfer", () => {
      // Execute some transaction which returns a TransactionResponse
      return gas.transfer(otherAccount.address, BigInt("10000000000000000000"))
    });
    balance = await gas.balanceOf(otherAccount.address);
    console.log("balance of recipient after transfer", balance);
  } catch (err) {
    console.log("%s", err);
  }
}

/* .once("transactionHash",hash => console.log(hash) */
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });