import BN from "bn.js";
import { encodeL1address } from "web3subscriber/src/addresses";
import { ChainConfig } from "zkwasm-deployment/src/types";
import { ProxyContract } from "./contracts/proxy";
import { TokenContract } from "./contracts/token";
import { GasContract } from "./contracts/gas";
import {
  DelphinusBrowserConnector,
  DelphinusReadOnlyConnector,
  DelphinusWalletConnector,
  GetBaseProvider,
} from "web3subscriber/src/provider";

const L1ADDR_BITS = 160;

function getDelphinusConnectorFromConfig(config: ChainConfig) {
  if (config.privateKey === "") {
    return new DelphinusReadOnlyConnector(config.wsSource);
  } else {
    return new DelphinusWalletConnector(
      config.privateKey,
      GetBaseProvider(config.rpcSource)
    );
  }
}

import { contractsInfo } from "zkwasm-deployment/config/contractsinfo";

export function getChargeAddress(deviceId: string) {
  let chargeAddress = contractsInfo.addressMap.gasToken[deviceId].address;
  let deviceIdHex = parseInt(deviceId).toString(16);
  let encodedChargeAddress =
    "0x" +
    encodeL1address(chargeAddress.substring(2), deviceIdHex).toString(16);
  return encodedChargeAddress;
}

export function dataToBN(data: any) {
  if (data.toHex) {
    data = data.toHex();
  }
  return new BN(data, 16);
}

export type DelphinusConnector =
  | DelphinusBrowserConnector
  | DelphinusReadOnlyConnector
  | DelphinusWalletConnector;

export type MaybePromise<T> = T | Promise<T>;

// Abstract class for DelphinusClient which should be implemented by client classes with necessary functions
export abstract class DelphinusClient {
  abstract getProxyContract(account?: string): MaybePromise<ProxyContract>;
  abstract getGasContract(
    address?: string,
    account?: string
  ): MaybePromise<GasContract>;
  abstract getTokenContract(
    address?: string,
    account?: string
  ): MaybePromise<TokenContract>;

  abstract getDefaultAccount(): MaybePromise<string> | undefined;
}

// L1 Browser Client to be used only in browser environments and typically with an injected/external wallet provider such as metamask.
export class L1BrowserClient extends DelphinusClient {
  readonly connector: DelphinusBrowserConnector;

  // some fields for the client which are different to server client
  readonly chainName: string;
  readonly chainId: string; // Store as string due to indexing json map in deployment repo

  // Pass in some params to the constructor to initialize the client
  constructor(chainName: string, chainId: number) {
    super();
    this.chainName = chainName;
    this.chainId = chainId.toString();
    this.connector = new DelphinusBrowserConnector();
  }

  async init() {
    console.log(`init_proxy on %s`, this.chainName);
    await this.switchNet();
  }

  async close() {
    // await this.web3.close();
  }

  getChainIdHex() {
    return "0x" + new BN(this.chainId).toString(16);
  }

  async getDefaultAccount() {
    return (await this.connector.getJsonRpcSigner()).getAddress();
  }

  async getProxyContract(): Promise<ProxyContract> {
    return new ProxyContract(
      ProxyContract.getContractAddress(this.chainId),
      await this.connector.getJsonRpcSigner()
    );
  }

  async getGasContract(address?: string): Promise<GasContract> {
    return new GasContract(
      address || GasContract.getContractAddress(this.chainId),
      await this.connector.getJsonRpcSigner()
    );
  }

  async getTokenContract(address?: string): Promise<TokenContract> {
    return new TokenContract(
      address || TokenContract.getContractAddress(this.chainId),
      await this.connector.getJsonRpcSigner()
    );
  }

  private async switchNet() {
    await this.connector.switchNet(this.getChainIdHex());
  }
}

// Client to be used in server environments. It uses a private key to sign transactions.
// If no private key is provided, it will be a read-only client.
export class L1ServerClient extends DelphinusClient {
  readonly connector: DelphinusWalletConnector | DelphinusReadOnlyConnector;
  protected readonly config: ChainConfig;
  constructor(config: ChainConfig) {
    super();
    let connector = getDelphinusConnectorFromConfig(config);
    this.config = config;
    this.connector = connector;
  }

  async init() {
    console.log(`init_proxy on %s`, this.config.chainName);

    // await this.connector.connect();
  }

  async close() {
    // await this.web3.close();
  }

  get signer() {
    if (this.connector instanceof DelphinusReadOnlyConnector) {
      return undefined;
    }
    return this.connector.signer;
  }

  get provider() {
    return this.connector.provider;
  }

  getChainIdHex() {
    return "0x" + new BN(this.config.deviceId).toString(16);
  }

  getDefaultAccount() {
    return this.signer ? this.signer.address : undefined;
  }

  getProxyContract() {
    return new ProxyContract(
      ProxyContract.getContractAddress(this.config.deviceId),
      this.signer || this.provider
    );
  }

  getGasContract(address?: string) {
    return new GasContract(
      address || GasContract.getContractAddress(this.config.deviceId),
      this.signer || this.provider
    );
  }

  getTokenContract(address?: string) {
    return new TokenContract(
      address || TokenContract.getContractAddress(this.config.deviceId),
      this.signer || this.provider
    );
  }

  /**
   *
   * @param address address must start with 0x
   * @returns
   */
  encodeL1Address(address: string) {
    if (address.substring(0, 2) != "0x") {
      throw "address must start with 0x";
    }

    const addressHex = address.substring(2);
    const chex = this.getChainIdHex().substring(2);
    return encodeL1address(addressHex, chex);
  }
}

export async function withL1ServerClient<T>(
  config: ChainConfig,
  cb: (_: L1ServerClient) => Promise<T>
) {
  const l1Client = new L1ServerClient(config);
  await l1Client.init();
  try {
    return await cb(l1Client);
  } finally {
    await l1Client.close();
  }
}

export async function withL1BrowserClient<T>(
  {
    chainName,
    chainId,
  }: {
    chainName: string;
    chainId: number;
  },
  cb: (_: L1BrowserClient) => Promise<T>
) {
  const l1Client = new L1BrowserClient(chainName, chainId);
  await l1Client.init();
  try {
    return await cb(l1Client);
  } finally {
    await l1Client.close();
  }
}
