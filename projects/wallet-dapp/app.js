// ID jaringan Sepolia (testnet Ethereum). Uang di sini tidak bernilai, aman untuk latihan.
const SEPOLIA_CHAIN_ID = 11155111n;
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; // angka yang sama, dalam format hex

let provider; // penghubung ke blockchain lewat MetaMask (untuk MEMBACA data)
let signer;   // akun kamu, dipakai untuk MENANDATANGANI transaksi

// Ambil elemen HTML supaya bisa diubah dari JavaScript
const $ = (id) => document.getElementById(id);

// 1. Sambungkan wallet
async function connectWallet() {
  // window.ethereum hanya ada kalau MetaMask (atau wallet lain) terpasang
  if (!window.ethereum) {
    setStatus("MetaMask not found. Install it from metamask.io first.", "err");
    return;
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []); // munculkan popup izin MetaMask
    signer = await provider.getSigner();
    await refreshWallet();
  } catch (err) {
    setStatus("Connection rejected: " + shortError(err), "err");
  }
}

// 2. Baca alamat, jaringan, dan saldo
async function refreshWallet() {
  const address = await signer.getAddress();
  const network = await provider.getNetwork();
  const onSepolia = network.chainId === SEPOLIA_CHAIN_ID;

  $("address").textContent = address;
  $("network").textContent = onSepolia ? "Sepolia ✅" : `Chain ${network.chainId} (not Sepolia)`;
  $("switchBtn").classList.toggle("hidden", onSepolia);
  $("walletInfo").classList.remove("hidden");
  $("sendBox").classList.toggle("hidden", !onSepolia);

  // Saldo dari blockchain dalam satuan "wei" (1 ETH = 10^18 wei), jadi kita ubah ke ETH
  const balanceWei = await provider.getBalance(address);
  $("balance").textContent = Number(ethers.formatEther(balanceWei)).toFixed(6);

  setStatus("Connected.", "ok");
  $("connectBtn").textContent = "Refresh";
}

// Minta MetaMask pindah ke jaringan Sepolia
async function switchToSepolia() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
    });
  } catch (err) {
    setStatus("Could not switch network: " + shortError(err), "err");
  }
}

// 3. Kirim ETH testnet ke alamat lain
async function sendEth() {
  const to = $("toInput").value.trim();
  const amount = $("amountInput").value.trim();

  // Cek input dulu sebelum kirim, supaya tidak buang gas untuk transaksi yang salah
  if (!ethers.isAddress(to)) return setTx("Recipient address is not valid.", "err");
  if (!(Number(amount) > 0)) return setTx("Amount must be greater than 0.", "err");

  $("sendBtn").disabled = true;
  try {
    setTx("Confirm the transaction in MetaMask…");
    const tx = await signer.sendTransaction({ to, value: ethers.parseEther(amount) });

    const link = `https://sepolia.etherscan.io/tx/${tx.hash}`;
    setTx(`Sent! Waiting for confirmation… <a href="${link}" target="_blank" rel="noopener">View on Etherscan</a>`, "", true);

    await tx.wait(); // tunggu sampai transaksi masuk ke block
    setTx(`Confirmed ✅ <a href="${link}" target="_blank" rel="noopener">View on Etherscan</a>`, "ok", true);
    await refreshWallet();
  } catch (err) {
    setTx("Transaction failed: " + shortError(err), "err");
  } finally {
    $("sendBtn").disabled = false;
  }
}

// --- Fungsi bantu tampilan ---
function setStatus(text, cls = "muted") {
  $("status").textContent = text;
  $("status").className = cls;
}

function setTx(text, cls = "", isHtml = false) {
  $("txStatus")[isHtml ? "innerHTML" : "textContent"] = text;
  $("txStatus").className = cls;
}

function shortError(err) {
  return err?.shortMessage || err?.message || String(err);
}

// Sambungkan tombol ke fungsinya
$("connectBtn").addEventListener("click", connectWallet);
$("switchBtn").addEventListener("click", switchToSepolia);
$("sendBtn").addEventListener("click", sendEth);

// Kalau user ganti akun atau jaringan di MetaMask, muat ulang halaman
if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => location.reload());
  window.ethereum.on("chainChanged", () => location.reload());
}
