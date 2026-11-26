import { configVariable, defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: "0.8.28",
  networks: {
    sepolia: {
      type: "http",
      chainType: "l1",
      // Rahasia ini TIDAK ditulis di file. Simpan pakai keystore terenkripsi:
      //   npx hardhat keystore set SEPOLIA_RPC_URL
      //   npx hardhat keystore set SEPOLIA_PRIVATE_KEY
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
  },
  verify: {
    etherscan: {
      //   npx hardhat keystore set ETHERSCAN_API_KEY
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  },
});
