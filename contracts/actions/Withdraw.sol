// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "../Transaction.sol";

contract Withdraw is Transaction {
    /*
     * u8:op
     * u8:token_index
     * u16: reserve (le mode)
     * u160: addr (be mode)
     * u64: amount (be mode)
     */
    function sideEffect(bytes memory witness, uint256 cursor)
        public
        pure
        override
        returns (uint256[] memory)
    {
        uint256[] memory ops = new uint256[](4);

        uint256 data32;
        uint256 offset = cursor + 32;
        assembly {
            // Load the 32 bytes of data from memory
            data32 := mload(add(witness, offset))
        }

        //ops[0] = uint256( (data32 >> (31*8)) & 0xFF );
        ops[0] = _WITHDRAW;

        // token index
        ops[1] = uint256( (data32 >> (30*8)) & 0x00FF );

        // amount to withdraw (wei not considered
        ops[2] = uint256( data32 & 0xFFFFFFFFFFFFFFFF );

        // recipent address
        ops[3] = uint256( (data32 >> (8*8)) & 0x00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF );
        return ops;
    }
}
