const GANACHE_CHAIN_ID = 1337n;
const STATUS_LABELS = ["Available", "Claim pending", "Returned", "Closed"];

const CONTRACT_ABI = [
  "function administrator() view returns (address)",
  "function itemCount() view returns (uint256)",
  "function reportItem(string itemName,string description,string foundLocation) returns (uint256)",
  "function requestClaim(uint256 itemId,string claimReference)",
  "function reviewClaim(uint256 itemId,bool approved)",
  "function closeItem(uint256 itemId)",
  "function getItem(uint256 itemId) view returns ((uint256 id,address reporter,string itemName,string description,string foundLocation,uint256 reportedAt,uint8 status,address claimant,string claimReference))",
  "event ItemReported(uint256 indexed itemId,address indexed reporter,string itemName,string foundLocation)",
  "event ClaimRequested(uint256 indexed itemId,address indexed claimant,string claimReference)",
  "event ClaimReviewed(uint256 indexed itemId,address indexed reporter,address indexed claimant,bool approved)",
  "event ItemClosed(uint256 indexed itemId,address indexed administrator)"
];

let provider;
let signer;
let contract;
let currentAccount = "";
let administrator = "";

const byId = (id) => document.getElementById(id);
const connectButton = byId("connectButton");
const loadContractButton = byId("loadContractButton");
const refreshButton = byId("refreshButton");
const reportForm = byId("reportForm");

function shorten(address) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function transactionError(error) {
  return error?.shortMessage || error?.reason || error?.info?.error?.message || error?.message || "Transaction failed";
}

function toast(message, isError = false) {
  const element = byId("toast");
  element.textContent = message;
  element.className = `toast show${isError ? " error" : ""}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { element.className = "toast"; }, 5000);
}

async function connectWallet() {
  if (!window.ethereum) {
    toast("MetaMask was not detected. Install or enable the browser extension.", true);
    return;
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const network = await provider.getNetwork();

    if (network.chainId !== GANACHE_CHAIN_ID) {
      toast(`Wrong network: chain ${network.chainId}. Select Ganache (1337) in MetaMask.`, true);
      byId("networkStatus").textContent = `Wrong network: ${network.chainId}. Select Ganache (1337).`;
      return;
    }

    signer = await provider.getSigner();
    currentAccount = await signer.getAddress();
    byId("walletStatus").textContent = shorten(currentAccount);
    byId("networkStatus").textContent = "Connected to Ganache (1337)";
    connectButton.textContent = "Wallet connected";
    toast("MetaMask connected to Ganache.");

    const savedAddress = localStorage.getItem("lostLoopContractAddress");
    if (savedAddress) {
      byId("contractAddress").value = savedAddress;
      await loadContract();
    }
  } catch (error) {
    toast(transactionError(error), true);
  }
}

async function loadContract() {
  if (!signer) {
    await connectWallet();
    if (!signer) return;
  }

  const address = byId("contractAddress").value.trim();
  if (!ethers.isAddress(address)) {
    toast("Enter a valid deployed contract address.", true);
    return;
  }

  try {
    const code = await provider.getCode(address);
    if (code === "0x") throw new Error("No contract exists at this address on Ganache.");

    contract = new ethers.Contract(address, CONTRACT_ABI, signer);
    administrator = await contract.administrator();
    localStorage.setItem("lostLoopContractAddress", address);
    byId("contractStatus").textContent = `Loaded ${shorten(address)}. Administrator: ${shorten(administrator)}`;
    await refreshItems();
    toast("Smart contract loaded.");
  } catch (error) {
    contract = null;
    toast(transactionError(error), true);
  }
}

async function sendTransaction(action, pendingMessage) {
  if (!contract) {
    toast("Load the deployed contract first.", true);
    return;
  }
  try {
    toast(pendingMessage);
    const tx = await action();
    toast(`Submitted ${tx.hash.slice(0, 12)}... Waiting for confirmation.`);
    await tx.wait();
    toast("Transaction confirmed on Ganache.");
    await refreshItems();
  } catch (error) {
    toast(transactionError(error), true);
  }
}

async function refreshItems() {
  if (!contract) return;
  const grid = byId("itemsGrid");
  grid.innerHTML = '<div class="empty-state">Retrieving blockchain data...</div>';

  try {
    const count = Number(await contract.itemCount());
    const results = await Promise.all(
      Array.from({ length: count }, (_, index) => contract.getItem(index + 1))
    );

    byId("itemCount").textContent = count;
    byId("availableCount").textContent = results.filter((item) => Number(item.status) === 0).length;
    byId("returnedCount").textContent = results.filter((item) => Number(item.status) === 2).length;

    if (!results.length) {
      grid.innerHTML = '<div class="empty-state">No items yet. Publish the first found-item report.</div>';
      return;
    }

    grid.innerHTML = results.reverse().map(renderItem).join("");
    attachItemActions();
  } catch (error) {
    grid.innerHTML = `<div class="empty-state">${escapeHtml(transactionError(error))}</div>`;
  }
}

function renderItem(item) {
  const status = Number(item.status);
  const id = Number(item.id);
  const reporterOwnsItem = currentAccount.toLowerCase() === item.reporter.toLowerCase();
  const isAdministrator = currentAccount.toLowerCase() === administrator.toLowerCase();
  const badgeClass = ["", "pending", "returned", "closed"][status];
  let actions = "";

  if (status === 0 && !reporterOwnsItem) {
    actions += `<input id="claim-${id}" maxlength="120" placeholder="Non-sensitive proof reference">`;
    actions += `<button class="small-button positive claim-button" data-id="${id}">Request claim</button>`;
  }
  if (status === 1 && reporterOwnsItem) {
    actions += `<button class="small-button positive review-button" data-id="${id}" data-approved="true">Approve return</button>`;
    actions += `<button class="small-button danger review-button" data-id="${id}" data-approved="false">Reject claim</button>`;
  }
  if (status === 0 && isAdministrator) {
    actions += `<button class="small-button danger close-button" data-id="${id}">Admin close</button>`;
  }

  return `
    <article class="item-card">
      <div class="item-head">
        <div><h3>#${id} ${escapeHtml(item.itemName)}</h3><p>${escapeHtml(item.description)}</p></div>
        <span class="badge ${badgeClass}">${STATUS_LABELS[status]}</span>
      </div>
      <div class="item-meta">
        <span><strong>Found:</strong> ${escapeHtml(item.foundLocation)}</span>
        <span><strong>Reported:</strong> ${new Date(Number(item.reportedAt) * 1000).toLocaleString()}</span>
        <span><strong>Reporter:</strong> <code>${shorten(item.reporter)}</code></span>
        <span><strong>Claimant:</strong> <code>${item.claimant === ethers.ZeroAddress ? "None" : shorten(item.claimant)}</code></span>
      </div>
      ${status === 1 ? `<p><strong>Claim reference:</strong> ${escapeHtml(item.claimReference)}</p>` : ""}
      ${actions ? `<div class="card-actions">${actions}</div>` : ""}
    </article>`;
}

function attachItemActions() {
  document.querySelectorAll(".claim-button").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      const reference = byId(`claim-${id}`).value.trim();
      sendTransaction(() => contract.requestClaim(id, reference), "Requesting claim...");
    });
  });
  document.querySelectorAll(".review-button").forEach((button) => {
    button.addEventListener("click", () => {
      const approved = button.dataset.approved === "true";
      sendTransaction(() => contract.reviewClaim(button.dataset.id, approved), approved ? "Approving return..." : "Rejecting claim...");
    });
  });
  document.querySelectorAll(".close-button").forEach((button) => {
    button.addEventListener("click", () => sendTransaction(() => contract.closeItem(button.dataset.id), "Closing listing..."));
  });
}

reportForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = byId("itemName").value.trim();
  const description = byId("description").value.trim();
  const location = byId("foundLocation").value.trim();
  sendTransaction(async () => {
    const tx = await contract.reportItem(name, description, location);
    reportForm.reset();
    return tx;
  }, "Publishing item report...");
});

connectButton.addEventListener("click", connectWallet);
loadContractButton.addEventListener("click", loadContract);
refreshButton.addEventListener("click", refreshItems);

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());
}
