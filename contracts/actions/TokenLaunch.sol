// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "../Transaction.sol";

contract TokenLaunch is Transaction {
    /*
     * Transaction data format for TokenLaunch (opcode 1):
     * WithdrawInfo encoding from Rust:
     * - feature: u32 (project_id << 8 | 1) - LE encoded in bytes 0-3
     * - address: [u8; 20] - constructed from limbs, contains token_supply and project_id
     * - amount: u64 - target_amount - BE encoded in bytes 24-31
     * 
     * limbs in Rust:
     * - limbs[0]: target_amount (full 64 bits preserved)
     * - limbs[1]: token_supply  
     * - limbs[2]: token_symbol (directly, no encoding needed)
     * 
     * Address construction in Rust:
     * - bytes 4-7: (limbs[0] >> 32) as u32 in LE = target_amount high 32 bits
     * - bytes 8-15: limbs[1] in LE = token_supply
     * - bytes 16-23: limbs[2] in LE = token_symbol (direct)
     */
    function sideEffect(bytes memory witness, uint256 cursor)
        public
        pure
        override
        returns (uint256[] memory)
    {
        uint256[] memory ops = new uint256[](5);

        uint256 data32;
        uint256 offset = cursor + 32;
        assembly {
            // Load the 32 bytes of data from memory
            data32 := mload(add(witness, offset))
        }

        // ops[0] = opcode (1 for token launch)
        ops[0] = _TOKEN_LAUNCH;

        // ops[1] = project_id (from token index field - byte 1)
        ops[1] = uint256( (data32 >> (30*8)) & 0x00FF );

        // ops[2] = target_amount (from amount field - bytes 24-31, BE)
        ops[2] = uint256( data32 & 0xFFFFFFFFFFFFFFFF );

        // ops[3] = token_supply (from address field bytes 8-15, stored as LE)
        // Extract bytes 8-15 from the address field and convert from LE to native
        uint256 token_supply_le = uint256( (data32 >> (8*8)) & 0xFFFFFFFFFFFFFFFF );
        // Convert from little-endian to big-endian
        ops[3] = ((token_supply_le & 0xFF) << 56) |
                 (((token_supply_le >> 8) & 0xFF) << 48) |
                 (((token_supply_le >> 16) & 0xFF) << 40) |
                 (((token_supply_le >> 24) & 0xFF) << 32) |
                 (((token_supply_le >> 32) & 0xFF) << 24) |
                 (((token_supply_le >> 40) & 0xFF) << 16) |
                 (((token_supply_le >> 48) & 0xFF) << 8) |
                 ((token_supply_le >> 56) & 0xFF);

        // ops[4] = token_symbol (from address field bytes 16-23, stored as LE)
        // Extract bytes 16-23 from the address field (token_symbol directly)
        uint256 token_symbol_le = uint256( (data32 >> (16*8)) & 0xFFFFFFFFFFFFFFFF );
        // Convert from little-endian to big-endian (64-bit)
        ops[4] = ((token_symbol_le & 0xFF) << 56) |
                 (((token_symbol_le >> 8) & 0xFF) << 48) |
                 (((token_symbol_le >> 16) & 0xFF) << 40) |
                 (((token_symbol_le >> 24) & 0xFF) << 32) |
                 (((token_symbol_le >> 32) & 0xFF) << 24) |
                 (((token_symbol_le >> 40) & 0xFF) << 16) |
                 (((token_symbol_le >> 48) & 0xFF) << 8) |
                 ((token_symbol_le >> 56) & 0xFF);

        return ops;
    }
} 