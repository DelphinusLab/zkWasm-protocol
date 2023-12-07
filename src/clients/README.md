## Example usage for L1ServerClient and L1BrowserClient

### L1 Server Client

Requires the config file to be present in the `zkwasm-deployment` directory.

A simple example to mint ERC-20 tokens and transfer them to another account.

```typescript
import { withL1ServerClient, L1ServerClient } from "src/clients/client";
import { getConfigByChainName } from "zkwasm-deployment/src/config";
import { TxBinder } from "web3subscriber/src/txbinder";
import { L1ClientRole } from "zkwasm-deployment/src/types";

async function main(configName: string, targetAccount: string) {
  let config = await getConfigByChainName(L1ClientRole.Monitor, configName);
  let account = config.monitorAccount;

  // Setup the client by providing the config with required information
  await withL1ServerClient(config, async (l1client: L1ServerClient) => {
    // Access underlying ethers providers and signers
    const { signer, provider } = l1client;

    // Signer is only available if the config has a private key, otherwise the client will be in read-only mode

    // Access the deployed contracts configured with this client
    // Similarly, these are read-only if the config does not have a private key
    let gasToken = l1client.getGasContract();
    let token = l1client.getTokenContract();
    let proxy = l1client.getProxyContract();

    // Use TxBinder to assign callbacks to transaction events
    // This is optional, but useful for debugging or certain patterns
    let txbinder = new TxBinder();

    // Assign callbacks to transaction events
    // Note the "mint" action string is arbitrary, they are used to identify the transaction and execution in txbinder.
    txbinder.when("mint", "transactionHash", (tx) =>
      console.log("transactionHash: ", tx?.hash)
    );
    txbinder.when("mint", "transactionReceipt", (receipt) =>
      console.log("receipt", receipt)
    );
    txbinder.when("mint", "error", (err) => console.log("error", err));

    // Execute the transaction by providing method with an ethers transaction
    await txbinder.execute("mint", () => {
      return token.mint(BigInt("10000000000000000000"));
    });

    // Directly call the implemented contract methods.
    let balance = await token.balanceOf(account);

    await txbinder.execute("transfer", () => {
      return token.transfer(targetAccount, BigInt("10000000000000000000"));
    });

    // Access any underlying unimplemented contract methods
    // Check ethers v6 documentation for more information
    let decimals = token.getEthersContract().decimals.staticCall();
    let name = token.getEthersContract().name.staticCall();

    // Manual contract call

    let tx = await token
      .getEthersContract()
      .transfer.send(targetAccount, BigInt("10000000000000000000"));

    // Wait for the transaction to be mined
    let receipt = await tx.wait();

    // Manual ethers transaction
    let tx = await signer.sendTransaction({
      to: targetAccount,
      value: 0,
      data: "0x",
    });

    // Wait for the transaction to be mined
    await tx.wait();
  });
}

main(process.argv[2], process.argv[3]);
```

### L1 Browser Client

```typescript
import { withL1BrowserClient, L1BrowserClient } from "../../src/clients/client";

async function BrowserExample() {
  await withL1BrowserClient(
    { chainId: 115511, chainName: "sepolia" },
    async (l1client: L1BrowserClient) => {
      // Connect to the browser provider such as Metamask
      // Most actions will be performed by the browser provider

      // init will ask the user to switch networks to the provided config network
      await l1client.init();

      const { connector } = l1client;
      // Connector information such as provider, user address, etc.

      const address = (await connector.getJsonRpcSigner()).address;
      console.log("address: ", address);

      // Contract methods can be called by the client
      let token = await l1client.getTokenContract();
      let proxy = await l1client.getProxyContract();

      // The client can call the functions implemented in the contract class
      let approval = await token.approve(
        await proxy.getEthersContract().getAddress(),
        BigInt("10000000000000000000")
      );

      await approval.wait();

      // Directly call the contract method if necessary
      let tx = await token.getEthersContract().transfer.send(BigInt(100));

      await tx.wait();

      console.log("transactionHash: ", tx?.hash);
    }
  );
}
```
