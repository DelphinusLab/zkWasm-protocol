// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Verifier.sol";
import "./Transaction.sol";
import "./DelphinusProxy.sol";
import "./Data.sol";
import "./TransferHelper.sol";

contract Proxy is DelphinusProxy {
    event TopUp(uint256 l1token, address account, uint256 amount);
    event WithDraw(address l1token, address l1account, uint256 amount);
    event Settled(address sender, uint256 merkle_root, uint256 new_merkle_root, uint256 rid, uint256 sideEffectCalled);

    TokenInfo[] public _tokens;
    Transaction[] public transactions;
    DelphinusVerifier public verifier;
    ProxyInfo _proxy_info;

    address internal _settler;
    uint256[3] public zk_image_commitments;
    uint256 public merkle_root;
    uint256 public rid;
    uint256 public withdrawLimit = 10000 * 1e18; //10000 Ti limit per settle

    mapping(uint256 => bool) private _tmap;
    mapping(uint256 => bool) private hasSideEffect;

    modifier onlyOwner() {
        require(msg.sender == _proxy_info.owner, "Only owner can call this function");
        _;
    }

    modifier onlySettler() {
        require(msg.sender == _settler, "Only settler can call this function");
        _;
    }

    constructor(uint32 chain_id, uint256 root) {
        _proxy_info.chain_id = chain_id;
        _proxy_info.owner = msg.sender;
        merkle_root = root;
        rid = 0;
    }

    /* Make sure token index is sain and return token uid */
    function get_token_uid(uint128 tidx) private view returns (uint256) {
        require(tidx < _proxy_info.amount_token, "OutOfBound: Token Index");
        return _tokens[tidx].token_uid;
    }

    function setOwner(address new_owner) external onlyOwner {
        _proxy_info.owner = new_owner;
    }

    function setMerkle(uint256 new_root) external onlyOwner {
	merkle_root = new_root;
    }

    function setVerifierImageCommitments(uint256[3] calldata commitments) external onlyOwner {
        zk_image_commitments[0] = commitments[0];
        zk_image_commitments[1] = commitments[1];
        zk_image_commitments[2] = commitments[2];
    }

    function setVerifier(address vaddr) public onlyOwner {
        verifier = DelphinusVerifier(vaddr);
    }

    function setSettler(address settler) external onlyOwner {
        _settler = settler;
    }

    function setWithdrawLimit(uint256 amount) public onlyOwner {
        withdrawLimit = amount;
    }

    function getProxyInfo() public view returns (ProxyInfo memory) {
        return
            ProxyInfo(
                _proxy_info.chain_id,
                _proxy_info.amount_token,
                _proxy_info.amount_pool,
                _proxy_info.owner,
                merkle_root,
                rid,
                uint256(uint160(address(verifier)))
            );
    }

    function addToken(uint256 token) public onlyOwner returns (uint32) {
        uint32 cursor = uint32(_tokens.length);
        _tokens.push(TokenInfo(token));
        _proxy_info.amount_token = cursor + 1;
        require(_tmap[token] == false, "AddToken: Token Already Exist");
        if (token != 0) {
            _tmap[token] = true;
        }
        return cursor;
    }

    function allTokens() public view returns (TokenInfo[] memory) {
        return _tokens;
    }

    function topup (
        uint128 tidx,
        uint128 amount  //in wei
    ) public {
        uint256 tokenid = get_token_uid(tidx);
        require (_is_local(tokenid), "token is not a local erc token");
        address token = address(uint160(tokenid));
        IERC20 underlying_token = IERC20(token);

        uint256 balance = underlying_token.balanceOf(msg.sender);
        require(balance >= amount, "Insufficient Balance");

        uint256 allowance = underlying_token.allowance(msg.sender, address(this));
        require(allowance >= amount, "Insufficient Allowance");

        //USDT does not follow ERC20 interface so have to use the following safer method
        TransferHelper.safeTransferFrom(address(underlying_token), msg.sender, address(this), amount);

	    //Tbd: Charge fees to developer

        emit TopUp(_l1_address(token), msg.sender, amount);
    }

    /* In convention, the wasm image does not take wei into consideration thus we need to apply  amout * 1e18
     * to get the actual amount of withdraw. Please make sure the wei of the withdraw token is 18
     */
    function _withdraw(
        uint128 tidx,
        uint128 amount,  //in ether
        uint256 l1recipent
    ) private {
        uint256 tokenid = get_token_uid(tidx);
        if (_is_local(tokenid)) {
            address token = address(uint160(tokenid));
            address recipent = address(uint160(l1recipent));

            // Sanitity checks
            require(recipent != address(0), "Withdraw to the zero address");

            // transfer amount back to recipent
            IERC20 underlying_token = IERC20(token);

            uint256 balance = underlying_token.balanceOf(address(this));
            require(balance >= amount * 1e18, "Insufficient balance for withdraw");

            require(amount * 1e18 <= withdrawLimit, "Withdraw amount exceed limit");

            TransferHelper.safeTransfer(address(underlying_token), recipent, amount * 1e18);
    	    emit WithDraw(token, recipent, amount * 1e18);
        }
    }

    function addTransaction(address txaddr, bool sideEffect) public onlyOwner returns (uint256) {
        uint256 cursor = transactions.length;
        require(transactions.length < 255, "TX index out of bound");
        transactions.push(Transaction(txaddr));
        if (sideEffect) {
          hasSideEffect[cursor] = sideEffect;
        }
        return cursor;
    }

    function _get_transaction(uint8 tid) public view returns (Transaction) {
        require(transactions.length > tid, "TX index out of bound");
        return transactions[tid];
    }

    /* encode the l1 address into token_uid */
    function _l1_address(address account) public view returns (uint256) {
        return
            (uint256(uint160(account))) +
            (uint256(_proxy_info.chain_id) << 160);
    }

    function _is_local(uint256 l1address) public view returns (bool) {
        return ((l1address >> 160) == (uint256(_proxy_info.chain_id)));
    }

    /*
     * @dev side effect encoded in the update function
     * deltas = [| opcode; args |]
     */
    function _update_state(uint256[] memory deltas) private {
        uint256 cursor = 0;
        while (cursor < deltas.length) {
            uint256 delta_code = deltas[cursor];
            if (delta_code == _WITHDRAW) {
                require(
                    deltas.length >= cursor + 4,
                    "Withdraw: Insufficient arg number"
                );
                _withdraw(
                    uint128(deltas[cursor + 1]),
                    uint128(deltas[cursor + 2]),
                    deltas[cursor + 3]
                );
                cursor = cursor + 4;
            } else {
                revert("SideEffect: UnknownSideEffectCode");
            }
        }
    }

    uint256 constant OP_SIZE = 32; // 32 bytes for each transaction
    function bytesToUint(bytes memory bs, uint256 start, uint256 len)
        internal
        pure
        returns (uint256)
    {
        require(bs.length >= start + 32, "slicing out of range");
        uint256 x;
        assembly {
            x := mload(add(bs, add(start, 0x20)))
        }
        return x >> (32 - len) * 8;
    }

    function perform_txs(
        bytes calldata tx_data
    ) private returns (uint256){
        uint256 ret = 0;
        uint256 batch_size = tx_data.length / OP_SIZE;
        for (uint i = 0; i < batch_size; i++) {
            uint8 op_code = uint8(bytesToUint(tx_data, i * OP_SIZE, 1));
            require(transactions.length > op_code, "TX index out of bound");
            if (hasSideEffect[op_code]) {
                Transaction transaction = _get_transaction(op_code);
                uint256[] memory update = transaction.sideEffect(tx_data, i * OP_SIZE);
                ret += 1;
                _update_state(update);
            }
        }
        return ret;
    }

    /*
     * @dev Data encodes the delta functions with there verification in reverse order
     * data = opcode args; opcode' args'; ....
     */
    function verify(
        bytes calldata tx_data,
        uint256[] calldata proof,
        uint256[] calldata verify_instance,
        uint256[] calldata aux,
        uint256[][] calldata instances
    ) onlySettler public {
	    // tbd: Add nonReentrant() if rm onlySettler

        uint256 sideEffectCalled;

	    // skip image commitments verification if it is not set
        if (zk_image_commitments[0] != 0) {
            require(verify_instance[1] == zk_image_commitments[0], "Invalid image commitment 0");
            require(verify_instance[2] == zk_image_commitments[1], "Invalid image commitment 1");
            require(verify_instance[3] == zk_image_commitments[2], "Invalid image commitment 2");
        }

        // [0]: old root, [1]: new root, [2]: sha_low, [3]: sha_high

	    if (tx_data.length > 1) {
            require(
                tx_data.length % OP_SIZE == 0,
                "Verify: Insufficient delta operations"
            );

            uint256 sha_pack = uint256(sha256(tx_data));
            require(
                sha_pack ==
                    (instances[0][8] << 192) +
                        (instances[0][9] << 128) +
                        (instances[0][10] << 64) +
                        instances[0][11],
                "Inconstant: Sha data inconsistant"
            );
	    }

        require(
            merkle_root ==
                (instances[0][0] << 192) +
                    (instances[0][1] << 128) +
                    (instances[0][2] << 64) +
                    instances[0][3],
            "Inconstant: Merkle root dismatch"
        );

        verifier.verify(proof, verify_instance, aux, instances);


	    if (tx_data.length > 1) {
            sideEffectCalled = perform_txs(tx_data);
	    }

        uint256 new_merkle_root = (instances[0][4] << 192) +
            (instances[0][5] << 128) +
            (instances[0][6] << 64) +
            instances[0][7];

        rid = rid + 1;

        emit Settled(msg.sender, merkle_root, new_merkle_root, rid, sideEffectCalled);
        merkle_root = new_merkle_root;
    }
}
