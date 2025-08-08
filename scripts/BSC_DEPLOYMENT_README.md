# BSC Mainnet Complete Deployment Script

这个脚本用于在BSC主网上部署完整的zkWasm Launchpad系统。

## 配置信息

### BSC主网配置
- **Chain ID**: 56 (BSC Mainnet)
- **POINTS Token**: `0xa8d3dee6671c4fdac4743a1eb1F276EabD4ba302`
- **USDT Token**: `0x55d398326f99059fF775485246999027B3197955`
- **Verifier Address**: `0xcecd1abb92c6b928b9bf4239b51429aad6ae1ccc`
- **Settler Address**: `0x4693728B330285A90e9355eB4e2C22fc01eadE76`
- **Withdraw Limit**: 10,000,000 ETH

### PancakeSwap V2配置
- **Factory**: `0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6`
- **Router**: `0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24`

## 部署步骤

脚本会按以下顺序执行：

1. **部署Withdraw合约** - 处理提取操作
2. **部署TokenLaunch合约** - 处理代币发布操作
3. **部署Proxy合约** - 主代理合约

然后进行配置：

4. **设置Settler** - 设置结算者地址
5. **设置Verifier** - 设置验证器地址
6. **设置提取限制** - 设置为1000万ETH
7. **添加交易合约** - 按opcode顺序添加Withdraw(0)和TokenLaunch(1)
8. **添加POINTS代币** - 将POINTS代币添加到索引0
9. **设置Uniswap地址** - 配置PancakeSwap V2工厂和路由器
10. **设置USDT小数位** - 设置为18位小数

## 环境配置

### 1. 设置环境变量

部署脚本需要配置私钥和RPC端点。按以下步骤设置：

```bash
# 1. 复制环境变量示例文件
cp env.example .env

# 2. 编辑.env文件，填入你的私钥
nano .env
```

**必需的环境变量：**
- `BSC_PRIVATE_KEY`: BSC主网部署账户的私钥
- `BSC_RPC_URL`: BSC RPC端点 (可选，有默认值)

**示例.env文件内容：**
```bash
# BSC主网私钥 (⚠️ 请替换为你的实际私钥)
BSC_PRIVATE_KEY=your_actual_private_key_here

# BSC RPC端点 (可选)
BSC_RPC_URL=https://bsc-dataseed1.binance.org/
```

### 2. 账户要求

部署账户需要满足以下条件：
- **BNB余额**: 至少0.1 BNB用于gas费用
- **权限**: 能够部署合约和执行配置交易
- **安全性**: 建议使用专用的部署账户，而非主钱包

### 3. 网络验证

脚本会自动验证当前网络是否为BSC主网(Chain ID: 56)，如果网络不匹配会自动退出。

## 运行脚本

```bash
# 确保在zkWasm-protocol目录下
cd zkWasm-protocol

# 确保已安装依赖
npm install

# 运行BSC主网部署脚本
npm run deploy-bsc

# 或者如果要在BSC测试网部署（用于测试）
npm run deploy-bsc-testnet

# 也可以直接使用hardhat命令
npx hardhat run scripts/deploy_bsc_complete.ts --network bsc
```

## 验证

脚本执行后会输出：
- 所有部署的合约地址
- 配置验证信息
- 代币配置详情
- Uniswap配置详情

## 注意事项

1. **环境变量**: 确保正确设置BSC_PRIVATE_KEY环境变量
2. **网络确认**: 脚本会自动验证当前网络是BSC主网(Chain ID: 56)
3. **Gas费用**: 确保部署账户有足够的BNB支付gas费用(建议至少0.1 BNB)
4. **权限**: 部署者需要有足够权限设置各种配置
5. **代币存在性**: 使用的POINTS和USDT代币地址必须是有效的合约地址
6. **安全性**: 
   - 永远不要将真实私钥提交到版本控制系统
   - 使用专用部署账户，而非主钱包
   - 在主网部署前先在测试网测试

## 输出格式

脚本成功执行后会输出TypeScript格式的地址常量：

```typescript
export const BSC_ADDRESSES = {
  proxy: "0x...",
  pointsToken: "0xa8d3dee6671c4fdac4743a1eb1F276EabD4ba302",
  usdtToken: "0x55d398326f99059fF775485246999027B3197955",
  withdraw: "0x...",
  tokenLaunch: "0x...",
  settlerAddress: "0x4693728B330285A90e9355eB4e2C22fc01eadE76",
  verifierAddress: "0xcecd1abb92c6b928b9bf4239b51429aad6ae1ccc",
  uniswapFactory: "0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6",
  uniswapRouter: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24"
};
```

## 后续步骤

1. 更新 `scripts/const.ts` 文件中的proxy地址
2. 测试withdraw points功能
3. 测试token launch功能
4. 如需要，在BscScan上验证合约

## 故障排除

如果部署失败，脚本会输出已部署的合约地址（如果有的话），方便调试和继续部署。