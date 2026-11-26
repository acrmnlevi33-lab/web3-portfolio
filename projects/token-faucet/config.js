// Isi setelah deploy kontrak ke Sepolia (lihat README.md bagian "Deploy").
// Contoh: "0x1234...abcd"
const CONTRACT_ADDRESS = "0x478cfF5278b32D15E5F2c6a2Db3f9FD96E1524DA";

// Nomor block saat kontrak di-deploy (lihat di Etherscan). Dipakai untuk mencari riwayat klaim.
const DEPLOY_BLOCK = 12217104;

// ABI = "daftar menu" fungsi kontrak yang dipakai website ini.
const FAUCET_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function claimAmount() view returns (uint256)",
  "function nextClaimAt(address) view returns (uint256)",
  "function claim()",
  "event Claimed(address indexed user, uint256 amount)",
  "error ClaimTooSoon(uint256 nextClaimAt)",
];
