import BN from "bn.js";
import * as retry from "retry";
import { DelphinusContract, DelphinusWeb3 } from "web3subscriber/src/client";
import { decodeL1address } from "web3subscriber/src/addresses";
import { PromiseBinder } from "web3subscriber/src/pbinder";
import { TokenContract } from "./token";
import { TxDeposit, TxData } from "../../index";
import {
  extraTokens,
  Chains,
  contractsInfo,
} from "zkwasm-deployment/config/contractsinfo";

const registeredTokens = contractsInfo.tokens.concat(extraTokens);

/*
 * Types
 */
export interface ProxyInfo {
  chain_id: string;
  amount_token: string;
  amount_pool: string;
  owner: string;
  merkle_root: string;
  rid: string;
  verifierID: string;
}

export interface TokenInfo {
  token_uid: string;
}

/*
 * Events
 */
export interface Deposit {
  l1token: string;
  l2account: string;
  amount: string;
  nonce: string;
}

export interface SwapAck {
  l2account: string;
  rid: string;
}

export interface WithDraw {
  l1account: string;
  l2account: string;
  amount: string;
  nonce: string;
}

export interface RidInfo {
  rid: BN;
  batch_size: BN;
}

function hexcmp(x: string, y: string) {
  const xx = new BN(x, "hex");
  const yy = new BN(y, "hex");
  return xx.eq(yy);
}

export class ProxyContract extends DelphinusContract {
  constructor(web3: DelphinusWeb3, address: string, account?: string) {
    super(web3, ProxyContract.getJsonInterface(), address, account);
  }

  static getJsonInterface(): any {
    return contractsInfo.interfaceMap.proxy;
  }

  static getContractAddress(chainId: string) {
    return contractsInfo.addressMap.proxy[chainId].address;
  }

  static checkAddHexPrefix(hexStr: string) {
    let s:string = hexStr;
    if(s.substring(0,2) != "0x")
      s = "0x" + s;
    return s;
  }

  getProxyInfo() {
    return this.getWeb3Contract().methods.getProxyInfo().call();
  }

  allTokens(): Promise<TokenInfo[]> {
    return this.getWeb3Contract().methods.allTokens().call();
  }

  addToken(tokenid: BN) {
    return this.getWeb3Contract().methods.addToken(tokenid).send();
  }

  private _verify(calldata: string, verifydata: BN[], verifyInstance: BN[], aux: BN[], instances: string[][], rid: RidInfo) {
    const calldataChecked:string = ProxyContract.checkAddHexPrefix(calldata);

    console.log("preparing verify", calldataChecked);
    console.log("preparing verify", verifydata);
    console.log("preparing verify", verifyInstance);
    console.log("preparing verify", instances);

    const tx = this.getWeb3Contract().methods.verify(
      calldataChecked,
      verifydata,
      verifyInstance,
      aux,
      instances,
      {
        rid: rid.rid.toString(),
        batch_size: rid.batch_size.toString()
      },
    );
    console.log("start send");
    return tx.send();
  }

  private _setVerifier(verifierAddress: string) {
    return this.getWeb3Contract()
      .methods.setVerifier(verifierAddress)
      .send();
  }

  verify(calldata: string, verifydata: BN[], verifyInstance: BN[], aux: BN[], instances: string[][], rid: RidInfo) {
    const pbinder = new PromiseBinder();

    return pbinder.return(async () => {
      return await pbinder.bind(
        "Verify",
        this._verify(calldata, verifydata, verifyInstance, aux, instances, rid)
      );
    });
  }

  approve_deposit (
    tokenContract: TokenContract,
    txdeposit: TxDeposit,
    l1account: string,
  ) {
    const pbinder = new PromiseBinder();
    //TODO assert txdeposit is TxDeposit

    return pbinder.return(async () => {
      let allowance = await tokenContract.allowanceOf(
        l1account,
        this.address()
      );
      console.log("Allowance is :", allowance.toString());
      pbinder.snapshot("Approve");
      if (allowance.lt(txdeposit.amount)) {
        if (!allowance.isZero()) {
          await pbinder.bind(
            "Approve",
            tokenContract.approve(this.address(), new BN(0))
          );
        }
        await pbinder.bind(
          "Approve",
          tokenContract.approve(
            this.address(),
            new BN(2).pow(new BN(256)).sub(new BN(1))
          )
        );
      }
      console.log("Deposit Info:", txdeposit);
    });
  }

  async setVerifier(verifierAddress: string) {
    await this._setVerifier(verifierAddress);
  }

  private async extractChainInfo() {
    let tokenInfos = await this.allTokens();
    let tokens = tokenInfos
      .filter((t) => t.token_uid != "0")
      .map((token) => {
        let [cid, address] = decodeL1address(token.token_uid);
        let registeredToken = registeredTokens.find(
          (x: any) => hexcmp(x.address, address) && x.chainId == cid
        )!;
        return {
          address: address,
          name: registeredToken.name,
          chainId: cid,
          wei: registeredToken.wei,
          index: tokenInfos.findIndex(
            (x: TokenInfo) => x.token_uid == token.token_uid
          ),
        };
      });
    let chain_list = Array.from(new Set(tokens.map((x) => x.chainId)));
    let token_list = chain_list.map((chain_id) => ({
      chainId: chain_id,
      chainName: Chains[chain_id],
      tokens: tokens.filter((x) => x.chainId == chain_id),
      enable: true,
    }));
    return token_list;
  }

  async getTokenInfo(idx: number) {
    const token = (await this.allTokens())[idx];
    let [cid, addr] = decodeL1address(token.token_uid);
    let registeredToken = registeredTokens.find(
      (x: any) => hexcmp(x.address, addr) && x.chainId == cid
    )!;
    return {
      chainId: cid,
      chainName: Chains[cid],
      tokenAddress: addr,
      wei: registeredToken.wei,
      tokenName: registeredToken.name,
      index: idx,
    };
  }

  async getMetaData() {
    //generic retry function that takes a promise and will retry 5 times.
    let retryGet = <T>(tryFunction: () => Promise<T>) => {
      let operation = retry.operation({
        retries: 5, // 11 attempts in total
        factor: 1,
        minTimeout: 1 * 1000, //minimum 1 second between first retry
        maxTimeout: 4 * 1000, //maximum of 3 seconds delay between retries
        randomize: true,
      });
      return new Promise<T>((resolve, reject) => {
        operation.attempt(async (currentAttempt) => {
          console.log("Attempt to get Info:", currentAttempt);
          try {
            let info = await tryFunction();
            resolve(info);
          } catch (err) {
            if (operation.retry(err as Error)) {
              return;
            }
            reject(operation.mainError());
          }
        });
      });
    };
    console.log("getting Proxy info");
    let _proxyInfo = await retryGet(
      () => this.getProxyInfo() as Promise<ProxyInfo>
    );
    console.log("getting token info");
    let _tokens = await retryGet(() => this.allTokens());
    console.log("getting chain info");
    let _chainInfo = await retryGet(() => this.extractChainInfo());
    return {
      proxyInfo: _proxyInfo,
      tokens: _tokens,
      chainInfo: _chainInfo,
    };
  }
    
}
