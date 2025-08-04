// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Verifier.sol";
import "./Transaction.sol";
import "./DelphinusProxy.sol";
import "./Data.sol";
import "./TransferHelper.sol";
import "./LaunchpadToken.sol";

// Uniswap V2 interfaces
interface IUniswapV2Factory {
    function createPair(address tokenA, address tokenB) external returns (address pair);
}

interface IUniswapV2Router02 {
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
}

contract Proxy is DelphinusProxy, ReentrancyGuard {
    event TopUp(uint256 l1token, address account, uint64 pid_1, uint64 pid_2, uint256 amount);
    event WithDraw(address l1token, address l1account, uint256 amount);
    event Settled(address sender, uint256 merkle_root, uint256 new_merkle_root, uint256 rid, uint256 sideEffectCalled);
    event TokenLaunched(
        uint256 indexed project_id, 
        address indexed token, 
        uint256 total_supply, 
        uint256 actual_token_amount, 
        uint256 actual_usdt_amount, 
        uint256 lp_tokens, 
        address indexed lp_recipient
    );

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
    
    // Uniswap V2 addresses (should be set by owner)
    address public uniswapV2Factory;
    address public uniswapV2Router;
    address public usdtToken; // USDT token address
    uint8 public usdtDecimals = 18; // USDT decimals (18 for BSC, 6 for Ethereum/Tron)

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

    function getSettler() public view returns (address) {
        return _settler;
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

    function setUniswapAddresses(
        address _factory,
        address _router,
        address _usdt
    ) external onlyOwner {
        uniswapV2Factory = _factory;
        uniswapV2Router = _router;
        usdtToken = _usdt;
    }

    function setUsdtDecimals(uint8 _decimals) external onlyOwner {
        require(_decimals > 0 && _decimals <= 18, "Invalid decimals");
        usdtDecimals = _decimals;
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

    function modifyToken(uint32 index, uint256 token) public onlyOwner{
        require(_tmap[token] == false, "AddToken: Token Already Exist");

        // Check if the index is within bounds of the array
        require(index < _tokens.length, "Index out of bounds");

        // Get original token_uid
        uint256 oldToken = _tokens[index].token_uid;

        // Remove original token_uid from _tamp
        if (oldToken != 0) {
            _tmap[oldToken] = false;
        }

        // Modify the token at the specified index
        _tokens[index].token_uid = token;

        // Add new token into _tmap
        _tmap[token] = true;
    }

    function allTokens() public view returns (TokenInfo[] memory) {
        return _tokens;
    }

    function topup (
        uint128 tidx,
        uint64 pid_1,
        uint64 pid_2,
        uint128 amount  //in wei
    ) nonReentrant public {
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

        emit TopUp(_l1_address(token), msg.sender, pid_1, pid_2, amount);
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

    function modifyTransaction(uint8 index, address txaddr, bool sideEffect) public onlyOwner {
        // Check if the index is within bounds of the array
        require(index < transactions.length, "Transaction index out of bounds");
        
        // Modify the transaction at the specified index
        transactions[index] = Transaction(txaddr);
        
        // Update the sideEffect flag
        hasSideEffect[index] = sideEffect;
    }

    function setSideEffect(uint8 index, bool sideEffect) public onlyOwner {
        // Check if the index is within bounds of the array
        require(index < transactions.length, "Transaction index out of bounds");
        
        // Update only the sideEffect flag
        hasSideEffect[index] = sideEffect;
    }

    function _get_transaction(uint8 tid) public view returns (Transaction) {
        require(transactions.length > tid, "TX index out of bound");
        return transactions[tid];
    }

    function allTransactions() public view returns (Transaction[] memory) {
        return transactions;
    }

    function getTransactionInfo(uint8 index) public view returns (address txAddress, bool sideEffect) {
        require(index < transactions.length, "Transaction index out of bounds");
        return (address(transactions[index]), hasSideEffect[index]);
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
            } else if (delta_code == _TOKEN_LAUNCH) {
                require(
                    deltas.length >= cursor + 5,
                    "TokenLaunch: Insufficient arg number"
                );
                _tokenLaunch(
                    uint128(deltas[cursor + 1]), // project_id
                    uint128(deltas[cursor + 2]), // target_amount
                    deltas[cursor + 3],          // token_supply
                    uint64(deltas[cursor + 4])   // token_symbol
                );
                cursor = cursor + 5;
            } else {
                revert("SideEffect: UnknownSideEffectCode");
            }
        }
    }

    function _tokenLaunch(
        uint128 project_id,
        uint128 target_amount,
        uint256 token_supply,
        uint64 token_symbol
    ) private {
        require(uniswapV2Factory != address(0), "Uniswap factory not set");
        require(uniswapV2Router != address(0), "Uniswap router not set");
        require(usdtToken != address(0), "USDT token not set");
        
        // Validate parameters
        require(project_id < 256, "Project ID too large");
        require(token_supply > 0, "Token supply must be greater than zero");
        require(target_amount > 0, "Target amount must be greater than zero");
        
        // Create new ERC20 token
        string memory tokenSymbolStr = _uint64ToString(token_symbol);
        string memory tokenName = string(abi.encodePacked(tokenSymbolStr, " Token"));
        
        LaunchpadToken newToken = new LaunchpadToken(
            tokenName,
            tokenSymbolStr,
            token_supply * 1e18, // Convert to wei (18 decimals)
            18, // 18 decimals
            project_id,
            address(this) // Proxy contract owns the tokens initially
        );
        
        // Add token to the tokens array at the correct index
        // Ensure the token index matches project_id
        if (_tokens.length <= project_id) {
            // Need to expand array to accommodate project_id
            while (_tokens.length <= project_id) {
                if (_tokens.length == project_id) {
                    // Add the new token at the correct index
                    _tokens.push(TokenInfo(_l1_address(address(newToken))));
                    _proxy_info.amount_token = uint32(_tokens.length);
                    _tmap[_l1_address(address(newToken))] = true;
                } else {
                    // Add placeholder tokens if needed
                    _tokens.push(TokenInfo(0));
                    _proxy_info.amount_token = uint32(_tokens.length);
                }
            }
        } else {
            // Array is already long enough, modify existing position
            uint256 existingToken = _tokens[project_id].token_uid;
            
            if (existingToken != 0) {
                // Slot is occupied, remove old token from map and replace
                _tmap[existingToken] = false;
            }
            
            // Set the new token at the specified index
            _tokens[project_id].token_uid = _l1_address(address(newToken));
            _tmap[_l1_address(address(newToken))] = true;
        }
        
        // Calculate liquidity amounts
        // Both target_amount and token_supply are passed as integers (not wei), so we need to convert both to wei
        uint256 usdtAmount = (target_amount * (10 ** usdtDecimals)) / 2; // Half of target_amount in USDT smallest unit
        uint256 tokenAmount = (token_supply * 1e18 * 20) / 100; // 20% of token supply in wei (18 decimals)
        
        // Transfer tokens for liquidity to this contract (already owned by this contract)
        // Transfer USDT for liquidity (assuming contract has enough USDT)
        IERC20 usdt = IERC20(usdtToken);
        require(usdt.balanceOf(address(this)) >= usdtAmount, "Insufficient USDT balance");
        
        // Approve router to spend tokens using safe approve
        TransferHelper.safeApprove(address(newToken), uniswapV2Router, tokenAmount);
        TransferHelper.safeApprove(usdtToken, uniswapV2Router, usdtAmount);
        
        // Add liquidity to Uniswap V2
        IUniswapV2Router02 router = IUniswapV2Router02(uniswapV2Router);
        (uint amountA, uint amountB, uint liquidity) = router.addLiquidity(
            address(newToken),
            usdtToken,
            tokenAmount,
            usdtAmount,
            (tokenAmount * 95) / 100, // 5% slippage tolerance
            (usdtAmount * 95) / 100,  // 5% slippage tolerance
            _proxy_info.owner, // LP tokens go to contract owner for liquidity management
            block.timestamp + 300 // 5 minute deadline
        );
        
        emit TokenLaunched(project_id, address(newToken), token_supply, amountA, amountB, liquidity, _proxy_info.owner);
    }

    // Helper function to convert uint64 to string (interpreting as packed bytes)
    function _uint64ToString(uint64 value) private pure returns (string memory) {
        if (value == 0) {
            return "TOKEN";
        }
        
        // Convert uint64 to bytes and then to string
        // Since value is already converted from LE to BE in TokenLaunch.sol,
        // we extract bytes in natural order (little-endian extraction from big-endian value)
        bytes memory buffer = new bytes(8);
        for (uint i = 0; i < 8; i++) {
            uint8 byteValue = uint8(value >> (i * 8));
            if (byteValue == 0) break; // Stop at null terminator
            buffer[i] = bytes1(byteValue); // Store in natural order
        }
        
        // Find actual length (excluding null bytes from the end)
        uint actualLength = 0;
        for (uint i = 0; i < 8; i++) {
            if (buffer[i] != 0) {
                actualLength = i + 1; // Length includes this non-zero byte
            }
        }
        
        if (actualLength == 0) {
            return "TOKEN";
        }
        
        // Create result with actual length
        bytes memory result = new bytes(actualLength);
        for (uint i = 0; i < actualLength; i++) {
            result[i] = buffer[i];
        }
        
        return string(result);
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
    ) onlySettler nonReentrant public {
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
