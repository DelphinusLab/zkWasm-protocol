// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "./Data.sol";


interface DelphinusProxy {
    /**
     * @dev snark verification stub
     */
    function getProxyInfo() external view returns (ProxyInfo memory);
    function addToken(uint256 token) external returns (uint32);
    function allTokens() external view returns (TokenInfo[] memory);

    function addTransaction(address txaddr, bool sideEffect) external returns (uint256);
    function addVerifier(address vaddr) external returns (uint256);
    function deposit(
        address token,
        uint256 amount,
        uint256 l2account
    ) external;

    function verify(
        bytes calldata tx_data,
        uint256[] calldata proof,
        uint256[] calldata verify_instance,
        uint256[] calldata aux,
        uint256[][] calldata target_instances,
        uint8 _vid,
        RidInfo memory ridInfo
    ) external;
}
