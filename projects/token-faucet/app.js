const SEPOLIA_CHAIN_ID = 11155111n;
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";
const ETHERSCAN = "https://sepolia.etherscan.io";

let provider, signer, token, countdownTimer;
const $ = (id) => document.getElementById(id);

// Tampilkan link kontrak (atau pesan kalau belum di-deploy)
if (CONTRACT_ADDRESS) {
  $("contractLink").href = `${ETHERSCAN}/address/${CONTRACT_ADDRESS}`;
  $("contractLink").textContent = CONTRACT_ADDRESS;
} else {
  $("contractLink").textContent = "not deployed yet (set CONTRACT_ADDRESS in config.js)";
}

async function connectWallet() {
  if (!window.ethereum) return setStatus("MetaMask not found. Install it from metamask.io first.", "err");
  if (!CONTRACT_ADDRESS) return setStatus("Contract address is empty. Deploy first, then fill config.js.", "err");

  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    // Objek kontrak: kita bisa panggil fungsi Solidity seperti fungsi JavaScript biasa
    token = new ethers.Contract(CONTRACT_ADDRESS, FAUCET_ABI, signer);
    await refresh();
  } catch (err) {
    setStatus("Connection failed: " + shortError(err), "err");
  }
}

async function refresh() {
  const address = await signer.getAddress();
  const { chainId } = await provider.getNetwork();
  const onSepolia = chainId === SEPOLIA_CHAIN_ID;

  $("tokenBox").classList.remove("hidden");
  $("switchBtn").classList.toggle("hidden", onSepolia);
  $("claimBtn").classList.toggle("hidden", !onSepolia);
  $("addTokenBtn").classList.toggle("hidden", !onSepolia);
  if (!onSepolia) return setStatus(`Connected as ${short(address)}, but you're on chain ${chainId}. Switch to Sepolia.`, "err");

  setStatus(`Connected as ${short(address)}`, "ok");

  // Baca beberapa data dari kontrak sekaligus (semuanya gratis, tanpa gas)
  const [balance, supply, amount, nextAt] = await Promise.all([
    token.balanceOf(address),
    token.totalSupply(),
    token.claimAmount(),
    token.nextClaimAt(address),
  ]);
  $("balance").textContent = fmt(balance);
  $("supply").textContent = fmt(supply);
  $("claimAmount").textContent = fmt(amount);
  startCountdown(Number(nextAt));
  loadHistory();
  $("connectBtn").textContent = "Refresh";
}

// Hitung mundur sampai boleh klaim lagi
function startCountdown(nextAt) {
  clearInterval(countdownTimer);
  const tick = () => {
    const left = nextAt - Math.floor(Date.now() / 1000);
    if (left <= 0) {
      clearInterval(countdownTimer);
      $("claimBtn").disabled = false;
      $("claimBtn").textContent = "Claim FCT";
      return;
    }
    $("claimBtn").disabled = true;
    const h = Math.floor(left / 3600), m = Math.floor((left % 3600) / 60), s = left % 60;
    $("claimBtn").textContent = `Next claim in ${h}h ${m}m ${s}s`;
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}

async function claim() {
  $("claimBtn").disabled = true;
  try {
    setTx("Confirm the transaction in MetaMask…");
    const tx = await token.claim();
    const link = `<a href="${ETHERSCAN}/tx/${tx.hash}" target="_blank" rel="noopener">View on Etherscan</a>`;
    setTx(`Sent! Waiting for confirmation… ${link}`, "", true);
    await tx.wait();
    setTx(`Claimed ✅ ${link}`, "ok", true);
    await refresh();
  } catch (err) {
    setTx("Claim failed: " + shortError(err), "err");
    $("claimBtn").disabled = false;
  }
}

// Tampilkan 10 klaim terakhir dari event "Claimed" di blockchain
async function loadHistory() {
  try {
    const events = await token.queryFilter(token.filters.Claimed(), DEPLOY_BLOCK);
    const list = $("history");
    list.innerHTML = "";
    for (const ev of events.slice(-10).reverse()) {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${ETHERSCAN}/tx/${ev.transactionHash}" target="_blank" rel="noopener">${short(ev.args.user)}</a> claimed ${fmt(ev.args.amount)} FCT`;
      list.appendChild(li);
    }
    if (!events.length) list.innerHTML = "<li>No claims yet. Be the first!</li>";
    $("historyBox").classList.remove("hidden");
  } catch (err) {
    console.warn("Could not load history:", err);
  }
}

// Minta MetaMask menampilkan token FCT di daftar aset
async function addTokenToWallet() {
  try {
    await window.ethereum.request({
      method: "wallet_watchAsset",
      params: { type: "ERC20", options: { address: CONTRACT_ADDRESS, symbol: "FCT", decimals: 18 } },
    });
  } catch (err) {
    setTx("Could not add token: " + shortError(err), "err");
  }
}

async function switchToSepolia() {
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }] });
  } catch (err) {
    setStatus("Could not switch network: " + shortError(err), "err");
  }
}

// --- Fungsi bantu ---
const fmt = (wei) => Number(ethers.formatUnits(wei, 18)).toLocaleString("en-US", { maximumFractionDigits: 2 });
const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

function setStatus(text, cls = "muted") { $("status").textContent = text; $("status").className = cls; }
function setTx(text, cls = "", isHtml = false) {
  $("txStatus")[isHtml ? "innerHTML" : "textContent"] = text;
  $("txStatus").className = cls;
}
function shortError(err) {
  // Kalau kontrak menolak karena cooldown, tampilkan pesan yang mudah dimengerti
  if (err?.revert?.name === "ClaimTooSoon") return "you already claimed. Wait for the cooldown to end.";
  return err?.shortMessage || err?.message || String(err);
}

$("connectBtn").addEventListener("click", connectWallet);
$("claimBtn").addEventListener("click", claim);
$("addTokenBtn").addEventListener("click", addTokenToWallet);
$("switchBtn").addEventListener("click", switchToSepolia);

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => location.reload());
  window.ethereum.on("chainChanged", () => location.reload());
}
