// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "../Transaction.sol";

contract TokenLaunch is Transaction {
    /*
     * Transaction data format for TokenLaunch (simplified):
     * TokenLaunchInfo encoding from Rust:
     * - bytes 0-7: project_id (LE)
     * - bytes 8-15: target_amount (LE) 
     * - bytes 16-23: token_supply (LE)
     * - bytes 24-31: token_symbol (LE)
     * 
     * All data is consistently stored in little-endian format,
     * eliminating the need for complex endianness conversions.
     */
    function sideEffect(bytes memory witness, uint256 cursor)
        public
        pure
        override
        returns (uint256[] memory)
    {
        uint256[] memory ops = new uint256[](5);

        // Load the 32 bytes of data from memory
        uint256 offset = cursor + 32;
        bytes32 data32;
        assembly {
            data32 := mload(add(witness, offset))
        }

        // ops[0] = opcode (1 for token launch)
        ops[0] = _TOKEN_LAUNCH;

        // ops[1] = project_id (bytes 0-7, LE)
        ops[1] = _extractU64LE(data32, 0);

        // ops[2] = target_amount (bytes 8-15, LE)
        ops[2] = _extractU64LE(data32, 8);

        // ops[3] = token_supply (bytes 16-23, LE)
        ops[3] = _extractU64LE(data32, 16);

        // ops[4] = token_symbol (bytes 24-31, LE)
        ops[4] = _extractU64LE(data32, 24);

        return ops;
    }

    /// Extract a 64-bit little-endian value from bytes32 at given byte offset
    function _extractU64LE(bytes32 data, uint256 byteOffset) private pure returns (uint256) {
        require(byteOffset <= 24, "Invalid byte offset");
        
        uint256 result = 0;
        for (uint256 i = 0; i < 8; i++) {
            uint256 byteIndex = byteOffset + i;
            uint256 byteValue = uint256(uint8(data[byteIndex]));
            result |= (byteValue << (i * 8));
        }
        
        return result;
    }
} 