# Alfath (Levi): Web3 Portfolio

Live site: https://acrmnlevi33-lab.github.io/web3-portfolio/

Frontend dApp developer in training, building on Ethereum testnets.

## Projects

### 1. FCT Token Faucet
My own ERC-20 token with an on-chain faucet: anyone can claim 100 FCT once every 24 hours.

- **Contract:** [`contracts/contracts/FaucetToken.sol`](contracts/contracts/FaucetToken.sol), Solidity 0.8.28 + OpenZeppelin 5 (`ERC20`, `Ownable`), custom error `ClaimTooSoon`, `Claimed` event
- **Tests:** [`contracts/test/FaucetToken.ts`](contracts/test/FaucetToken.ts), Hardhat 3 + Mocha/Chai, covering cooldown, per-address limits, time travel and owner-only settings
- **Deployed & verified on Sepolia:** [`0x478cfF5278b32D15E5F2c6a2Db3f9FD96E1524DA`](https://sepolia.etherscan.io/address/0x478cfF5278b32D15E5F2c6a2Db3f9FD96E1524DA#code) (deployed with Hardhat Ignition)
- **Frontend:** [`projects/token-faucet/`](projects/token-faucet/), vanilla JS + ethers v6: wallet connect, network switch, balance, live cooldown countdown, claim history read from contract events, "add token to MetaMask"

```bash
cd contracts && npm install && npx hardhat test
```

### 2. Sepolia Wallet dApp
[`projects/wallet-dapp/`](projects/wallet-dapp/) — connect MetaMask, read balance, send test ETH with input validation and Etherscan links.

## Stack
Solidity · Hardhat · OpenZeppelin · JavaScript · ethers.js · MetaMask · Sepolia
