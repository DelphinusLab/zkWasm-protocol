import BN from "bn.js";
import { TxDeposit, Address} from "../../index";

export interface RidInfo {
  rid: BN;
  batch_size: BN;
}