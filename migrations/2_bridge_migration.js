const Proxy = artifacts.require("Proxy");
const Withdraw = artifacts.require("Withdraw");
const Deposit = artifacts.require("Deposit");
const Supply = artifacts.require("Supply");
const Swap = artifacts.require("Swap");
const Retrive = artifacts.require("Retrive");
const AddPool = artifacts.require("AddPool");
const SetKey = artifacts.require("SetKey");
const DummyVerifier = artifacts.require("DummyVerifier");
const BN = require('bn.js');

const initial_root = new Uint8Array([166, 157, 178, 62, 35, 83, 140, 56, 9, 235, 134, 184, 20, 145, 63, 43, 245, 186, 75, 233, 43, 42, 187, 217, 104, 152, 219, 89, 125, 199, 161, 9]);

let root_bn = new BN(initial_root, 16, "le");

module.exports = async function (deployer) {
  id = await web3.eth.net.getId();
  console.log("netid", id);

  await Promise.all([
    deployer.deploy(Proxy, id, root_bn),
    //deployer.deploy(ZKPVerifier, id),
    deployer.deploy(DummyVerifier, id),
  ]);

  deposit = await Deposit.deployed();
  withdraw = await Withdraw.deployed();
  swap = await Swap.deployed();
  retrive = await Retrive.deployed();
  supply = await Supply.deployed();
  addpool = await AddPool.deployed();
  setkey = await SetKey.deployed();
  proxy = await Proxy.deployed();
  //zkverifier = await ZKPVerifier.deployed();
  dmverifier = await DummyVerifier.deployed();

  var tx = await proxy.addTransaction(deposit.address, true);
  tx = await proxy.addTransaction(withdraw.address, true);
  tx = await proxy.addTransaction(swap.address, false);
  tx = await proxy.addTransaction(supply.address, false);
  tx = await proxy.addTransaction(retrive.address, false);
  tx = await proxy.addTransaction(addpool.address, false);
  tx = await proxy.addTransaction(setkey.address, false);
  //tx = await proxy.addVerifier(zkverifier.address);
  tx = await proxy.setVerifier(dmverifier.address);
};
