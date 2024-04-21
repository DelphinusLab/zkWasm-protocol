# zkWasm-protocol

## transaction format

### Each transaction has 80 bytes in total

- op: 1 byte
- nonce: 7 bytes
- args: 72 bytes

### Commands Structure

- common struct: accountIndex(4 bytes) objectIndex(4 bytes)

- opcode: enum { deposit, withdraw, ... }

redeploy contract
--reset: This flag resets the deployments from scratch. Previously deployed contracts are not considered and deleted from disk.