import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("FaucetTokenModule", (m) => {
  const token = m.contract("FaucetToken");
  return { token };
});
