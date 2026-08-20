/* ============================================================
   JOURNAL3 — App Logic
   ethers.js v6 · MetaMask · BOT Chain (EVM-compatible)
   ============================================================ */

'use strict';

/* ─── Network Configuration ──────────────────────────────── */
const NETWORKS = {
  testnet: {
    chainId:         '0x3C8',          // 968 decimal
    chainName:       'BOT Chain Testnet (Bohr)',
    rpcUrls:         ['https://rpc.bohr.life'],
    blockExplorerUrls: ['https://scan.bohr.life'],
    nativeCurrency:  { name: 'BOT', symbol: 'BOT', decimals: 18 },
  },
  mainnet: {
    chainId:         '0x2A5',          // 677 decimal
    chainName:       'BOT Chain Mainnet',
    rpcUrls:         ['https://rpc.botchain.ai'],
    blockExplorerUrls: ['https://scan.botchain.ai'],
    nativeCurrency:  { name: 'BOT', symbol: 'BOT', decimals: 18 },
  },
};

let _useTestnet = localStorage.getItem('useTestnet') !== 'false';
let ACTIVE_NET = _useTestnet ? NETWORKS.testnet : NETWORKS.mainnet;
const CONTRACT_ADDRESS = '0xBd9c1896A5eD022c4c708295E0D72a45F3E4F413';

const CONTRACT_ABI = [
  'function writeEntry(string text, uint8 mood, string imageURI) returns (uint256 entryId)',
  'function editEntry(uint256 entryId, string newText, uint8 newMood, string newImageURI)',
  'function deleteEntry(uint256 entryId)',
  'function getMyEntries() view returns (tuple(uint256 id, address author, string text, uint8 mood, string imageURI, uint256 timestamp, bool isDeleted, bool isMinted)[])',
  'function mintEntryAsNFT(uint256 entryId, string tokenURI_) returns (uint256 tokenId)',
];

/* ─── Mood Data (SVG Icons) ──────────────────────────────── */
const MOODS = [
  { score: 1, label: 'Rough', color: '#B0C4DE', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 15s1.5-2 4-2 4 2 4 2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>' },
  { score: 2, label: 'Meh', color: '#D3D3D3', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="14" x2="16" y2="14"></line><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>' },
  { score: 3, label: 'Okay', color: '#BEE3DB', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 13s1.5 1 4 1 4-1 4-1"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>' },
  { score: 4, label: 'Good', color: '#FFDAB9', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>' },
  { score: 5, label: 'Great', color: '#FFFACD', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line><path d="M9 14v1a3 3 0 0 0 6 0v-1"></path></svg>' },
];

/* ─── SVG Icons (UI) ──────────────────────────────────────── */
function ico(name, size = 14) {
  return ICONS[name].replace('<svg', `<svg width="${size}" height="${size}" style="display:inline-block;vertical-align:-2px;margin-right:5px;"`);
}
const ICONS = {
  chain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  testnet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v5.5L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 8.5V3"/><path d="M7 15h10"/></svg>',
  mainnet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>',
  medal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14" r="6"/><circle cx="12" cy="14" r="2.5" fill="currentColor"/><path d="M8.5 9.5 7 3h10l-1.5 6.5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16.5v.01"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.01"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z"/></svg>',
  list: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/></svg>',
  calendar: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  view: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
  frown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 15s1.5-2 4-2 4 2 4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
  smile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
};
const ARTICLES = [
  {
    id: 1,
    title: "When Work Stresses You",
    icon: "💻",
    color: "#FFE4D6",
    content: `
      <p style="margin-bottom: 12px;">Work-related stress is incredibly common, but it doesn't have to define your day. When you feel overwhelmed, try the <strong>3-3-3 rule</strong>: Name three things you see, three things you hear, and move three parts of your body.</p>
      <p>This simple grounding technique can pull your mind out of spiraling anxiety and back into the present moment. Remember, your productivity does not define your worth. Take a deep breath, and tackle one small task at a time.</p>
    `
  },
  {
    id: 2,
    title: "How to Stop Beating Yourself Up",
    icon: "🔍",
    color: "#D1F2D1",
    content: `
      <p style="margin-bottom: 12px;">Mistakes are inevitable, yet we often treat ourselves far more harshly than we would a friend. Self-compassion is the antidote to self-criticism.</p>
      <p>The next time you catch yourself spiraling over an error, pause. Ask yourself: <em>"What would I say to a friend in this exact situation?"</em> Usually, it's something kind and forgiving. Offer that same grace to yourself. Growth happens through trial and error, not perfection.</p>
    `
  },
  {
    id: 3,
    title: "How to Relax and Unwind",
    icon: "🧘",
    color: "#FFF6C0",
    content: `
      <p style="margin-bottom: 12px;">True relaxation isn't just zoning out in front of a screen; it's active recovery. Try creating a <em>"wind-down window"</em> 30 minutes before bed.</p>
      <p>Put away devices, dim the lights, and engage in a soothing activity like reading, gentle stretching, or writing in your journal. By signaling to your brain that the day's demands are over, you can drastically improve your sleep quality and wake up feeling truly restored.</p>
    `
  },
  {
    id: 4,
    title: "Understanding Your Rhythms",
    icon: "🕰️",
    color: "#E2D9F3",
    content: `
      <p style="margin-bottom: 12px;">We all have internal biological clocks known as circadian rhythms. Paying attention to when you feel most energized can revolutionize your day.</p>
      <p>Instead of forcing focus when you're naturally tired (like the classic mid-afternoon slump), schedule demanding tasks for your peak hours. Use low-energy periods for administrative tasks, taking a walk, or simply resting. Work with your body, not against it.</p>
    `
  },
  {
    id: 5,
    title: "The Power of Gratitude",
    icon: "✨",
    color: "#D9EDF8",
    content: `
      <p style="margin-bottom: 12px;">Gratitude journaling is one of the most scientifically proven ways to boost your baseline happiness. But the trick isn't just listing things—it's feeling them.</p>
      <p>Instead of writing a generic list of five things, try focusing on just <em>one</em> specific thing that went well today. Write down exactly why it made you smile, how it felt, and why you appreciate it. Depth builds stronger neural pathways for joy than breadth.</p>
    `
  }
];

/* ─── App State ──────────────────────────────────────────── */
let _provider      = null;
let _signer        = null;
let _contract      = null;
let _wallet        = null;
let _freighterWallet = localStorage.getItem('freighterWallet') || null;
let _xlmBalance    = '0';
let _entries       = [];
let _currentPanel  = 'dashboard';
let _selectedMood  = null;
let _pendingEntryId = null;
let _calYear       = new Date().getFullYear();
let _calMonth      = new Date().getMonth();
let _entriesView   = 'list';
let _editMood      = null;

/* ═══════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  checkExistingConnection();

  const nav = document.getElementById('landing-nav');
  window.addEventListener('scroll', () => {
    nav && nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  if (window.ethereum) {
    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged', (chainId) => {
      if (chainId.toLowerCase() === NETWORKS.mainnet.chainId.toLowerCase()) {
        localStorage.setItem('useTestnet', 'false');
      } else if (chainId.toLowerCase() === NETWORKS.testnet.chainId.toLowerCase()) {
        localStorage.setItem('useTestnet', 'true');
      }
      window.location.reload();
    });
  }

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
});

function getTimeOfDay() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

/* ═══════════════════════════════════════════════════════════
   WALLET
═══════════════════════════════════════════════════════════ */
async function checkExistingConnection() {
  if (_freighterWallet) {
    showApp();
    fetchXlmBalance();
  }
  if (!window.ethereum) return;
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) await setupProvider(accounts[0]);
  } catch (err) {
    console.warn('checkExistingConnection:', err.message);
  }
}

async function connectWallet() {
  closeModal('wallet-modal');
  if (!window.ethereum) {
    openModal('metamask-modal');
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts.length) throw new Error('No accounts returned');
    await setupProvider(accounts[0]);
  } catch (err) {
    if (err.code === 4001) showToast('Wallet connection cancelled.', 'info');
    else showToast('Connection failed: ' + err.message, 'error');
  }
}

async function setupProvider(account) {
  _provider = new ethers.BrowserProvider(window.ethereum);
  _signer   = await _provider.getSigner();
  _wallet   = account;

  const network = await _provider.getNetwork();
  const hexId   = '0x' + network.chainId.toString(16);

  if (hexId.toLowerCase() !== ACTIVE_NET.chainId.toLowerCase()) {
    await requestNetworkSwitch();
  } else {
    finishSetup();
  }
}

async function requestNetworkSwitch() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ACTIVE_NET.chainId }],
    });
  } catch (err) {
    if (err.code === 4902) {
      try {
        await window.ethereum.request({
          method:  'wallet_addEthereumChain',
          params:  [ACTIVE_NET],
        });
      } catch (addErr) {
        showToast('Could not add BOT Chain to MetaMask: ' + addErr.message, 'error');
      }
    } else if (err.code !== 4001) {
      showToast('Network switch failed: ' + err.message, 'error');
    }
  }
}

function finishSetup() {
  initContract();
  showApp();
  loadAndRender();
}

function initContract() {
  if (CONTRACT_ADDRESS === 'YOUR_CONTRACT_ADDRESS_HERE') {
    showToast('Contract address not set. Open app.js and set CONTRACT_ADDRESS.', 'info');
    return;
  }
  try {
    _contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, _signer);
  } catch (err) {
    showToast('Contract init failed: ' + err.message, 'error');
  }
}

function onAccountsChanged(accounts) {
  if (!accounts.length) disconnectWallet();
  else if (accounts[0].toLowerCase() !== _wallet.toLowerCase()) window.location.reload();
}

function disconnectWallet() {
  _wallet    = null;
  _signer    = null;
  _provider  = null;
  _contract  = null;
  _entries   = [];
  _freighterWallet = null;
  _xlmBalance = '0';
  document.getElementById('app').classList.remove('active');
  document.getElementById('app').style.display = 'none';
  document.getElementById('landing').style.display = 'flex';
}

async function connectFreighter() {
  closeModal('wallet-modal');
  if (!window.freighterApi) {
    showToast('Freighter extension not found.', 'error');
    return;
  }
  
  try {
    const connRes = await window.freighterApi.isConnected();
    if (!connRes || !connRes.isConnected) {
      showToast('Freighter not connected or installed.', 'error');
      return;
    }
    const accessRes = await window.freighterApi.requestAccess();
    if (accessRes.error) throw new Error(accessRes.error);
    if (!accessRes.address) throw new Error('No public key returned');
    
    _freighterWallet = accessRes.address;
    localStorage.setItem('freighterWallet', _freighterWallet);
    showApp();
    await fetchXlmBalance();
  } catch (err) {
    showToast('Freighter connection failed: ' + err.message, 'error');
  }
}

function disconnectFreighter() {
  _freighterWallet = null;
  localStorage.removeItem('freighterWallet');
  _xlmBalance = '0';
  document.getElementById('stellar-balance').textContent = '0 XLM';
  showApp(); // Re-render topbar
  
  if (!_wallet) {
    // If metamask is also not connected, hide app completely
    document.getElementById('app').classList.remove('active');
    document.getElementById('app').style.display = 'none';
    document.getElementById('landing').style.display = 'flex';
  }
  showToast('Freighter disconnected.', 'info');
}

async function fetchXlmBalance() {
  if (!_freighterWallet) return;
  try {
    const horizonUrl = _useTestnet ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org';
    const server = new StellarSdk.Horizon.Server(horizonUrl);
    const account = await server.loadAccount(_freighterWallet);
    const nativeBalance = account.balances.find(b => b.asset_type === 'native');
    if (nativeBalance) {
      _xlmBalance = parseFloat(nativeBalance.balance).toFixed(2);
      document.getElementById('stellar-balance').textContent = _xlmBalance + ' XLM';
    }
  } catch (err) {
    console.warn('Could not fetch XLM balance:', err);
    _xlmBalance = '0.00';
    document.getElementById('stellar-balance').textContent = '0.00 XLM';
  }
}

function showApp() {
  document.getElementById('landing').style.display = 'none';
  const app = document.getElementById('app');
  app.style.display = 'flex';
  requestAnimationFrame(() => app.classList.add('active'));

  const mmChip = document.getElementById('wallet-chip');
  if (_wallet) {
    const short = `${_wallet.slice(0, 6)}…${_wallet.slice(-4)}`;
    document.getElementById('wallet-address-short').textContent = short;
    mmChip.style.display = 'flex';
  } else {
    mmChip.style.display = 'none';
  }

  const stellarChip = document.getElementById('stellar-wallet-chip');
  if (_freighterWallet) {
    const short = `${_freighterWallet.slice(0, 4)}…${_freighterWallet.slice(-4)}`;
    document.getElementById('stellar-address-short').textContent = short;
    stellarChip.style.display = 'flex';
  } else {
    stellarChip.style.display = 'none';
  }

  const badge   = document.getElementById('network-badge');
  const isTest  = ACTIVE_NET.chainId === '0x3C8';
  badge.className = `network-badge ${isTest ? 'testnet' : 'mainnet'}`;
  badge.innerHTML = isTest ? ico('testnet', 12) + ' Testnet' : ico('mainnet', 12) + ' Mainnet';
}

function navigateTo(panel) {
  _currentPanel = panel;
  document.querySelectorAll('.sidebar-btn').forEach(btn => {
    if(btn.id !== 'nav-logout') {
      const isActive = btn.dataset.panel === panel;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    }
  });
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`panel-${panel}`);
  if (target) target.classList.add('active');

  switch (panel) {
    case 'dashboard': renderDashboard();    break;
    case 'write':     renderWritePanel();   break;
    case 'entries':   renderEntries();      break;
    case 'settings':  renderSettings();     break;
    case 'mood':      renderMood();         break;
  }
}

/* ═══════════════════════════════════════════════════════════
   CHAIN LOGIC
═══════════════════════════════════════════════════════════ */
async function loadAndRender() {
  await loadEntries();
  renderDashboard();
}

async function loadEntries() {
  if (!_contract) return;
  try {
    const raw = await _contract.getMyEntries();
    _entries = raw.map(e => ({
      id:        Number(e.id),
      author:    e.author,
      text:      e.text,
      mood:      Number(e.mood),
      timestamp: Number(e.timestamp),
      isDeleted: e.isDeleted,
      isMinted:  e.isMinted,
    })).sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.error('loadEntries:', err);
    showToast('Could not load entries from chain.', 'error');
  }
}

async function txWriteEntry(text, mood) {
  // Pass empty string since we removed photo support
  return runTx(() => _contract.writeEntry(text, mood, ""), 'Entry saved on chain!', 'write');
}

async function txEditEntry(id, text, mood) {
  return runTx(() => _contract.editEntry(id, text, mood, ""), 'Entry updated!', 'edit');
}

async function txDeleteEntry(id) {
  return runTx(() => _contract.deleteEntry(id), 'Entry hidden (soft-deleted).', 'delete');
}

async function txMintEntry(entryId, tokenURI) {
  return runTx(() => _contract.mintEntryAsNFT(entryId, tokenURI), 'NFT minted!', 'mint');
}

async function runTx(txFn, successMsg, action) {
  if (!_contract) {
    showToast('Please connect MetaMask to save entries to BOT Chain.', 'error');
    return null;
  }
  try {
    const tx = await txFn();
    showToast('Transaction submitted — waiting for confirmation…', 'info');
    const receipt = await tx.wait();
    
    const explorerUrl = `${ACTIVE_NET.blockExplorerUrls[0]}/tx/${receipt.hash}`;
    const explorerLink = ` <a href="${explorerUrl}" target="_blank" style="color:var(--ink);text-decoration:underline;">View Transaction</a>`;
    showToast(successMsg + explorerLink, 'success');
    await loadEntries();
    if (_currentPanel === 'dashboard') renderDashboard();
    if (_currentPanel === 'entries') renderEntries();
    return receipt;
  } catch (err) {
    console.error(`Tx error (${action}):`, err);
    if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
      showToast('Transaction rejected by user.', 'info');
    } else {
      showToast(`Transaction failed: ${err.reason || err.message}`, 'error');
    }
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════ */
function renderDashboard() {
  const container = document.getElementById('dashboard-content');
  if (!container) return;

  const today = new Date();
  const name = ls('displayName') || 'Journaler';
  
  // Find Monday of current week
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  
  let weekHtml = '<div class="dash-week">';
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dateNum = d.getDate();
    const k = dayKey(d);
    
    // Find latest entry for this date
    let latestForDay = null;
    _entries.forEach(e => {
      if (dayKey(new Date(e.timestamp * 1000)) === k) {
         if (!latestForDay || e.timestamp > latestForDay.timestamp) {
           latestForDay = e;
         }
      }
    });

    let iconHtml = '<div class="dash-week-empty"></div>';
    if (latestForDay) {
      const mood = getMood(latestForDay.mood);
      iconHtml = `<div class="dash-week-mood" style="background-color: ${mood.color}">${mood.svg}</div>`;
    }
    
    weekHtml += `
      <div class="dash-week-day">
        <span class="dash-week-name">${dayName}</span>
        <span class="dash-week-num">${dateNum}</span>
        ${iconHtml}
      </div>
    `;
  }
  weekHtml += '</div>';

  container.innerHTML = `
    <div class="dash-header">
      <div class="dash-header-left">
        <p class="dash-greeting">Good ${getTimeOfDay()}, <span>${esc(name)}</span></p>
        <p class="dash-date">Today, ${fmtDateShort(new Date())}</p>
      </div>
      <button class="dash-settings-btn" onclick="navigateTo('settings')" aria-label="Settings">⚙️</button>
    </div>
    
    ${weekHtml}
    
    <div class="dash-center-action">
      <h2 class="dash-title">How do you feel?</h2>
      <button class="dash-checkin-btn" onclick="navigateTo('write')">check in</button>
    </div>
    
    <div class="dash-for-you">
      <h3>For You</h3>
      <p class="dash-for-you-sub">Recommendations based on your records</p>
      <div class="dash-recommendations">
        ${ARTICLES.map(a => `
          <div class="dash-rec-card" style="background:${a.color};" onclick="openArticle(${a.id})" role="button" tabindex="0">
            <div class="dash-rec-icon">${a.icon}</div>
            <p>${a.title}</p>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="dash-whats-on-mind">
      <h3 style="margin-bottom: 12px; font-family: var(--font-serif); font-weight: 600; color: var(--ink);">What's on your mind?</h3>
      <button class="dash-write-btn" onclick="navigateTo('write')">Write your thoughts</button>
    </div>
  `;
}

function renderMood() {
  const container = document.getElementById('mood-content');
  if (!container) return;

  const year = _calYear;
  const month = _calMonth;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const prevMonth = month === 0 ? 11 : month - 1;
  const monthLabel = months[month];
  const prevMonthLabel = months[prevMonth];

  const byDay = {};
  _entries.forEach(e => {
    const k = dayKey(new Date(e.timestamp * 1000));
    const d = new Date(e.timestamp * 1000);
    if (d.getFullYear() === year && d.getMonth() === month) {
      if (!byDay[k] || e.timestamp > byDay[k].timestamp) byDay[k] = e;
    }
  });

  const firstDay = new Date(year, month, 1).getDay();
  const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1; // Mon=0, Sun=6
  const daysInMon = new Date(year, month + 1, 0).getDate();

  let cells = '';
  for (let i = 0; i < firstDayAdjusted; i++) {
    cells += '<div style="height: 48px;"></div>';
  }

  const moodCounts = { 1:0, 2:0, 3:0, 4:0, 5:0 };
  let totalDaysWithMood = 0;

  for (let d = 1; d <= daysInMon; d++) {
    const k = `${year}-${month}-${d}`;
    const entry = byDay[k];
    
    if (entry) {
      const mood = getMood(entry.mood);
      moodCounts[entry.mood]++;
      totalDaysWithMood++;
      cells += `
        <div style="padding:2px;">
          <div style="background: var(--white); border: 1px solid var(--surface-2); border-radius: var(--r-md); padding: 4px 4px 3px; cursor:pointer; height: 48px; box-sizing:border-box; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; overflow:hidden;" onclick="openViewModal(${entry.id})" title="${esc(entry.text.slice(0, 120))}">
            <div style="background-color: ${mood.color}; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color:var(--ink); flex-shrink:0;">
              <div style="width:12px;height:12px;">${mood.svg}</div>
            </div>
            <div style="font-size: 9.5px; color: var(--ink-3); line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${mood.label}</div>
          </div>
        </div>
      `;
    } else {
      cells += `
        <div style="padding:2px;">
          <div style="background-color: var(--surface-2); width: 100%; height: 48px; border-radius: 10px;"></div>
        </div>
      `;
    }
  }

  let donutHtml = '';
  if (totalDaysWithMood > 0) {
    donutHtml = `
      <div style="position: relative; width: 100%; max-width: 320px; margin: 0 auto; aspect-ratio: 2 / 1; overflow: hidden;">
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 200%; border-radius: 50%; overflow: hidden; display: flex;">
          ${MOODS.map(m => `
            <div style="flex: 1; height: 100%; background: ${m.color}; display: flex; justify-content: center; align-items: flex-end; padding-bottom: 4px;">
              <div style="height: 26px; display: flex; align-items: flex-end; color: var(--ink); width: 24px;">${m.svg}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div style="display:flex; justify-content:center; gap:16px; margin-top:24px; flex-wrap:wrap;">
        ${[1,2,3,4,5].filter(m => moodCounts[m]>0).map(m => `
          <div style="display:flex; align-items:center; gap:6px; font-size:13px; color:var(--ink-2);">
            <div style="width:12px;height:12px;border-radius:50%;background:${getMood(m).color};"></div>
            ${getMood(m).label}
          </div>
        `).join('')}
      </div>
    `;
  } else {
    donutHtml = `<p style="text-align:center; color:var(--ink-3); padding: var(--sp-8);">No moods logged this month yet.</p>`;
  }

  container.innerHTML = `
    <!-- Top Nav Tabs -->
    <div style="display:flex; justify-content:center; gap:var(--sp-6); margin-bottom: var(--sp-8);">
      <button class="btn-ghost" style="color:var(--ink-3); font-size:16px;">Week</button>
      <button class="btn-ghost" style="background:var(--ink); color:var(--white); border-radius:var(--r-md); padding: 8px 20px; font-size:16px;">Month</button>
      <button class="btn-ghost" style="color:var(--ink-3); font-size:16px;">Year</button>
    </div>

    <!-- Month Selector -->
    <div style="display:flex; gap:var(--sp-4); margin-bottom: var(--sp-10); overflow-x: auto; scrollbar-width:none; padding-bottom:4px; align-items:center; justify-content:center;">
      <button class="btn-ghost" style="border:1px solid var(--surface-2); padding: 8px 16px; border-radius: var(--r-md); color:var(--ink-2);">${year}</button>
      <button class="btn-ghost" style="border:1px solid var(--surface-2); padding: 8px 16px; border-radius: var(--r-md); color:var(--ink-2);" onclick="_calMonth--; if(_calMonth<0){_calMonth=11; _calYear--;} renderMood();">${prevMonthLabel}</button>
      <button class="btn-ghost" style="background:var(--ink-2); color:var(--white); padding: 8px 20px; border-radius: var(--r-md);">${monthLabel}</button>
      <button class="btn-ghost" style="border:1px solid var(--surface-2); padding: 8px 16px; border-radius: var(--r-md); color:var(--ink-2);" onclick="_calMonth++; if(_calMonth>11){_calMonth=0; _calYear++;} renderMood();">❯</button>
    </div>

    <!-- Stats Row (Side by Side) -->
    <div style="display: flex; gap: var(--sp-8); justify-content: center; flex-wrap: wrap; margin-bottom: var(--sp-16); align-items: stretch;">
      
      <!-- Average Mood Section -->
      <div style="flex: 1; min-width: 300px; max-width: 380px; display: flex; flex-direction: column; align-items: center;">
        <div style="text-align: center; margin-bottom: var(--sp-5);">
          <h2 style="font-family: var(--font-serif); font-size: 1.6rem; font-weight: var(--w-bold); color: var(--ink); margin-bottom: 4px; letter-spacing:-0.01em;">Average Mood</h2>
          <p style="color: var(--ink-2); font-size: 14px;">Your average mood by day</p>
        </div>
        
        <div style="background: var(--white); border-radius: var(--r-xl); padding: var(--sp-6); box-shadow: var(--shadow-sm); width: 100%; flex: 1; box-sizing: border-box;">
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; text-align: center; font-size: 11px; color: var(--ink-3); margin-bottom: 10px; font-weight:500;">
            <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
            ${cells}
          </div>
        </div>
      </div>

      <!-- Mood Distribution Section -->
      <div style="flex: 1; min-width: 300px; max-width: 380px; display: flex; flex-direction: column; align-items: center;">
        <div style="text-align: center; margin-bottom: var(--sp-5);">
          <h2 style="font-family: var(--font-serif); font-size: 1.6rem; font-weight: var(--w-bold); color: var(--ink); margin-bottom: 4px; letter-spacing:-0.01em;">Mood Distribution</h2>
          <p style="color: var(--ink-2); font-size: 14px;">The moods you've experienced most often</p>
        </div>
        
        <div style="background: var(--white); border-radius: var(--r-xl); padding: var(--sp-6); box-shadow: var(--shadow-sm); width: 100%; flex: 1; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; aspect-ratio: 1 / 1; max-height: 330px;">
          ${donutHtml}
        </div>
      </div>
      
    </div>

    <!-- Check In Action -->
    <div class="dash-center-action" style="margin-top: var(--sp-4);">
      <h2 class="dash-title">How do you feel today?</h2>
      <button class="dash-checkin-btn" onclick="navigateTo('write')">Check in mood</button>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   WRITE FORM
═══════════════════════════════════════════════════════════ */
function renderWritePanel() {
  const container = document.getElementById('write-content');
  if (!container) return;
  container.innerHTML = writeFormHtml();
}

function writeFormHtml() {
  return `
    <div class="write-form" id="wf-panel">
      <!-- Mood -->
      <div class="form-group">
        <label class="form-label">How are you feeling? *</label>
        <div class="mood-selector">
          <span class="mood-end-label">${ico('frown', 18)} Unpleasant</span>
          <div class="mood-steps" id="mood-steps-panel">
            ${MOODS.map(m => `
              <div class="mood-step" data-score="${m.score}">
                <button class="mood-btn" id="mood-btn-panel-${m.score}"
                        style="color:var(--ink);"
                        title="${m.label}"
                        onclick="pickMood(${m.score})"
                        aria-label="Mood ${m.score}: ${m.label}"
                        type="button">
                  <div style="width:24px;height:24px;">${m.svg}</div>
                </button>
                <span class="mood-btn-label">${m.label}</span>
              </div>`).join('')}
          </div>
          <span class="mood-end-label" style="text-align:right">Pleasant ${ico('smile', 18)}</span>
        </div>
      </div>

      <!-- Text -->
      <div class="form-group">
        <label class="form-label" for="jtxt-panel">What's on your mind?</label>
        <textarea class="form-textarea" id="jtxt-panel" rows="7"
                  placeholder="Write freely. This will be stored permanently on BOT Chain…"
                  aria-required="true"></textarea>
      </div>

      <p class="chain-note">
        <span class="chain-note-icon">${ico('chain', 14)}</span>
        Entries live permanently on BOT Chain.
      </p>

      <div class="form-actions">
        <button class="btn-save" id="save-btn-panel" type="button"
                onclick="handleSave()">
          Save Entry ${ico('sparkle', 15)}
        </button>
      </div>
    </div>
  `;
}

function pickMood(score) {
  _selectedMood = score;
  MOODS.forEach(m => {
    const btn = document.getElementById(`mood-btn-panel-${m.score}`);
    if (btn) {
      if (m.score === score) {
        btn.classList.add('selected');
        btn.style.backgroundColor = m.color;
      } else {
        btn.classList.remove('selected');
        btn.style.backgroundColor = 'var(--surface)';
      }
    }
  });
}

async function handleSave() {
  const text = document.getElementById(`jtxt-panel`)?.value?.trim();
  if (!_selectedMood) { showToast('Please select your mood first!', 'error'); return; }
  if (!text)          { showToast('Please write something!', 'error');       return; }

  const btn = document.getElementById(`save-btn-panel`);
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="margin:0 auto;"></div>'; }

  const receipt = await txWriteEntry(text, _selectedMood);

  if (btn) { btn.disabled = false; btn.innerHTML = 'Save Entry ' + ico('sparkle', 15); }

  if (receipt) {
    _selectedMood = null;
    navigateTo('entries');
  }
}

/* ═══════════════════════════════════════════════════════════
   ENTRIES
═══════════════════════════════════════════════════════════ */
function renderEntries() {
  const container = document.getElementById('entries-content');
  if (!container) return;

  const toggleHtml = `
    <div class="view-toggle" role="group" aria-label="View mode">
      <button class="view-toggle-btn ${_entriesView === 'list' ? 'active' : ''}"
              onclick="setEntriesView('list')">${ico('list', 14)} List</button>
      <button class="view-toggle-btn ${_entriesView === 'calendar' ? 'active' : ''}"
              onclick="setEntriesView('calendar')">${ico('calendar', 14)} Calendar</button>
    </div>
  `;

  if (_entries.length === 0) {
    container.innerHTML = toggleHtml + `
      <div class="empty-state">
        <div class="empty-icon">${ico('pen', 44)}</div>
        <h3 class="empty-title">No entries yet</h3>
        <p class="empty-text">Write your first entry and it'll live on BOT Chain forever.</p>
        <button class="btn-primary" onclick="navigateTo('write')">Write First Entry</button>
      </div>
    `;
    return;
  }

  if (_entriesView === 'list') {
    container.innerHTML = toggleHtml + _entries.map(entryCardHtml).join('');
  } else {
    container.innerHTML = toggleHtml + calGridHtml(_calYear, _calMonth);
    bindCalNav();
  }
}

function setEntriesView(view) {
  _entriesView = view;
  renderEntries();
}

function entryCardHtml(entry) {
  const date = new Date(entry.timestamp * 1000);
  const excerpt = esc(entry.text.slice(0, 260)) + (entry.text.length > 260 ? '…' : '');

  return `
    <div class="entry-card" id="ec-${entry.id}">
      <div class="entry-card-head">
        <span class="entry-card-date">${fmtDateFull(date)}</span>
        <div class="entry-card-badges">
          ${moodChipHtml(entry.mood)}
          ${entry.isMinted ? `<span class="nft-badge">${ico('medal', 13)} NFT</span>` : ''}
        </div>
      </div>
      <p class="entry-excerpt">${excerpt}</p>
      <div class="entry-actions">
        <button class="entry-action-btn" onclick="openViewModal(${entry.id})">${ico('view', 14)} View</button>
        <button class="entry-action-btn" onclick="openEditModal(${entry.id})">${ico('edit', 14)} Edit</button>
        <button class="entry-action-btn del" onclick="openDeleteModal(${entry.id})">${ico('trash', 14)} Delete</button>
        ${!entry.isMinted
          ? `<button class="entry-action-btn" onclick="openMintModal(${entry.id})">${ico('medal', 14)} Mint NFT</button>`
          : `<span class="nft-badge" style="margin-left:auto;">${ico('medal', 13)} Minted</span>`}
      </div>
    </div>
  `;
}

/* ── Calendar ── */
function calGridHtml(year, month) {
  const byDay = {};
  _entries.forEach(e => {
    const k = dayKey(new Date(e.timestamp * 1000));
    if (!byDay[k] || e.timestamp > byDay[k].timestamp) byDay[k] = e;
  });

  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMon = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  let cells = '';
  for (let i = 0; i < firstDay; i++) cells += '<div class="cal-day cal-empty"></div>';

  for (let d = 1; d <= daysInMon; d++) {
    const k = `${year}-${month}-${d}`;
    const entry = byDay[k];
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const mood = entry ? getMood(entry.mood) : null;

    cells += `
      <div class="cal-day ${isToday ? 'cal-today' : ''}"
           role="button" tabindex="0"
           onclick="${entry ? `openViewModal(${entry.id})` : ''}">
        <span class="cal-day-num">${d}</span>
        ${entry ? `<div class="cal-day-snip">${esc(entry.text.slice(0, 80))}${entry.text.length > 80 ? '…' : ''}</div>` : ''}
        ${mood ? `<div class="cal-mood-dot" style="background:${mood.color}"></div>` : ''}
      </div>
    `;
  }

  return `
    <div>
      <div class="cal-header">
        <button class="cal-nav-btn" id="cal-prev">❮</button>
        <h3 class="cal-month-label">${monthLabel}</h3>
        <button class="cal-nav-btn" id="cal-next">❯</button>
      </div>
      <div class="cal-grid">
        ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="cal-weekday">${d}</div>`).join('')}
        ${cells}
      </div>
    </div>
  `;
}

function bindCalNav() {
  document.getElementById('cal-prev')?.addEventListener('click', () => {
    _calMonth--; if (_calMonth < 0) { _calMonth = 11; _calYear--; }
    renderEntries();
  });
  document.getElementById('cal-next')?.addEventListener('click', () => {
    _calMonth++; if (_calMonth > 11) { _calMonth = 0; _calYear++; }
    renderEntries();
  });
}

/* ═══════════════════════════════════════════════════════════
   MODALS
═══════════════════════════════════════════════════════════ */
function openViewModal(id) {
  const entry = _entries.find(e => e.id === id);
  if (!entry) return;
  document.getElementById('view-modal-title').textContent = fmtDateFull(new Date(entry.timestamp * 1000));
  document.getElementById('view-modal-body').innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
      ${moodChipHtml(entry.mood)}
      ${entry.isMinted ? `<span class="nft-badge">${ico('medal', 13)} NFT</span>` : ''}
    </div>
    <p style="color:var(--ink-2);line-height:1.8;white-space:pre-wrap;font-size:0.9375rem;">${esc(entry.text)}</p>
    <div class="entry-actions" style="margin-top:16px;">
      <button class="entry-action-btn" onclick="closeModal('view-modal');openEditModal(${id})">${ico('edit', 14)} Edit</button>
      <button class="entry-action-btn del" onclick="closeModal('view-modal');openDeleteModal(${id})">${ico('trash', 14)} Delete</button>
    </div>
  `;
  openModal('view-modal');
}

function openEditModal(id) {
  const entry = _entries.find(e => e.id === id);
  if (!entry) return;
  _pendingEntryId = id;
  _editMood = entry.mood;

  document.getElementById('edit-modal-body').innerHTML = `
    <div class="write-form" style="gap:16px;">
      <div class="form-group">
        <label class="form-label">Mood</label>
        <div class="mood-selector">
          <span class="mood-end-label">${ico('frown', 18)} Unpleasant</span>
          <div class="mood-steps">
            ${MOODS.map(m => `
              <div class="mood-step">
                <button class="mood-btn" id="mood-btn-edit-${m.score}"
                        style="color:var(--ink); background: ${m.score === entry.mood ? m.color : 'var(--surface)'}; box-shadow: ${m.score === entry.mood ? '0 4px 16px rgba(0,0,0,0.18)' : 'none'}; transform: ${m.score === entry.mood ? 'scale(1.18)' : 'scale(1)'};"
                        onclick="pickEditMood(${m.score})" type="button">
                  <div style="width:24px;height:24px;">${m.svg}</div>
                </button>
                <span class="mood-btn-label">${m.label}</span>
              </div>`).join('')}
          </div>
          <span class="mood-end-label" style="text-align:right">Pleasant ${ico('smile', 18)}</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="edit-txt">Entry text</label>
        <textarea class="form-textarea" id="edit-txt" rows="7">${esc(entry.text)}</textarea>
      </div>
      <div class="modal-actions">
        <button class="btn-ghost" type="button" onclick="closeModal('edit-modal')">Cancel</button>
        <button class="btn-save" type="button" onclick="submitEdit()">Save Changes</button>
      </div>
    </div>
  `;
  openModal('edit-modal');
}

function pickEditMood(score) {
  _editMood = score;
  MOODS.forEach(m => {
    const btn = document.getElementById(`mood-btn-edit-${m.score}`);
    if (btn) {
      if (m.score === score) {
        btn.style.background = m.color;
        btn.style.transform = 'scale(1.18)';
        btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
      } else {
        btn.style.background = 'var(--surface)';
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = 'none';
      }
    }
  });
}

async function submitEdit() {
  const text = document.getElementById('edit-txt')?.value?.trim();
  if (!text)      { showToast('Entry text cannot be empty.', 'error');  return; }
  if (!_editMood) { showToast('Please select a mood.', 'error');        return; }
  closeModal('edit-modal');
  await txEditEntry(_pendingEntryId, text, _editMood);
}

function openDeleteModal(id) {
  _pendingEntryId = id;
  document.getElementById('delete-confirm-btn').onclick = async () => {
    closeModal('delete-modal');
    await txDeleteEntry(_pendingEntryId);
  };
  openModal('delete-modal');
}

function openMintModal(id) {
  const entry = _entries.find(e => e.id === id);
  if (!entry) return;
  _pendingEntryId = id;
  const mood = getMood(entry.mood);
  const excerpt = esc(entry.text.slice(0, 120));

  document.getElementById('mint-modal-body').innerHTML = `
    <div style="background:var(--surface);border-radius:12px;padding:16px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <div style="width:24px;height:24px;color:var(--ink);">${mood.svg}</div>
        <span style="font-size:13px;color:var(--ink-3);">${fmtDateFull(new Date(entry.timestamp * 1000))}</span>
      </div>
      <p style="font-size:13px;color:var(--ink-2);line-height:1.65;">${excerpt}${entry.text.length > 120 ? '…' : ''}</p>
    </div>
    <p style="font-size:12px;color:var(--ink-4);line-height:1.55;">
      NFT metadata (mood, date, text excerpt) will be generated as a base64 string.
    </p>
  `;

  document.getElementById('mint-confirm-btn').onclick = async () => {
    closeModal('mint-modal');
    await handleMint(_pendingEntryId);
  };
  openModal('mint-modal');
}

async function handleMint(id) {
  const entry = _entries.find(e => e.id === id);
  if (!entry) return;
  const mood = getMood(entry.mood);

  const metadata = {
    name: `Journal3 Entry #${id}`,
    description: entry.text.slice(0, 200),
    attributes: [
      { trait_type: 'Mood', value: mood.label },
      { trait_type: 'Mood Score', value: entry.mood },
      { trait_type: 'Date', value: fmtDateFull(new Date(entry.timestamp * 1000)) },
      { trait_type: 'Chain', value: ACTIVE_NET.chainName },
    ],
  };

  const tokenURI = 'data:application/json;base64,' + btoa(JSON.stringify(metadata));
  await txMintEntry(id, tokenURI);
}

/* ═══════════════════════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════════════════════ */
function renderSettings() {
  const container = document.getElementById('settings-content');
  if (!container) return;

  const displayName = ls('displayName') || '';
  const avatarSrc   = ls('avatarDataURL') || '';
  const short       = _wallet ? `${_wallet.slice(0,6)}…${_wallet.slice(-4)}` : '—';
  const initials    = avatarInitials(displayName || short);

  container.innerHTML = `
    <!-- Profile -->
    <div class="settings-card">
      <p class="settings-card-title">Profile</p>
      <div class="settings-row">
        <span class="settings-row-label">Avatar</span>
        <div class="settings-row-right">
          <div class="avatar-ring" id="av-ring" onclick="triggerAvatarInput()" title="Change avatar">
            ${avatarSrc ? `<img src="${avatarSrc}" alt="Avatar">` : initials}
          </div>
          <button class="btn-ghost" style="font-size:13px;" onclick="triggerAvatarInput()">Change</button>
        </div>
      </div>
      <div class="settings-row">
        <span class="settings-row-label">Display Name</span>
        <div class="settings-row-right">
          <input class="settings-input" id="name-input" type="text" value="${esc(displayName)}" placeholder="Journaler" style="width:150px;">
          <button class="btn-save" style="padding:8px 16px;font-size:13px;" onclick="saveDisplayName()">Save</button>
        </div>
      </div>
    </div>

    <!-- Wallet -->
    <div class="settings-card">
      <p class="settings-card-title">Wallet & Network</p>
      <div class="settings-row">
        <span class="settings-row-label">Address</span>
        <span class="settings-row-value mono">${_wallet || '—'}</span>
      </div>
      <div class="settings-row">
        <span class="settings-row-label">Current Network</span>
        <span class="settings-row-value">${ACTIVE_NET.chainName}</span>
      </div>
      <div class="settings-row">
        <span class="settings-row-label">Network Mode</span>
        <div class="settings-row-right">
          <label style="display:flex; align-items:center; gap:8px; font-size:13px; cursor:pointer;">
            <input type="checkbox" id="network-toggle" ${ _useTestnet ? 'checked' : '' } onchange="toggleNetworkMode(this.checked)" />
            Use Testnet
          </label>
        </div>
      </div>
      <div class="settings-row">
        <span class="settings-row-label" style="color:var(--error);">Disconnect</span>
        <button class="btn-danger" style="font-size:13px;" onclick="disconnectWallet()">Disconnect Wallet</button>
      </div>
    </div>

  `;
}

function saveDisplayName() {
  const name = document.getElementById('name-input')?.value?.trim();
  if (!name) { showToast('Please enter a display name.', 'error'); return; }
  lsSet('displayName', name);
  showToast('Display name saved!', 'success');
}

function triggerAvatarInput() {
  const inp = document.getElementById('avatar-input');
  if(!inp) return;
  inp.onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      lsSet('avatarDataURL', ev.target.result);
      renderSettings();
      showToast('Avatar updated!', 'success');
    };
    reader.readAsDataURL(f);
    inp.value = '';
  };
  inp.click();
}

function avatarInitials(str) {
  if (!str) return '?';
  return str.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase();
}

/* ═══════════════════════════════════════════════════════════
   MODAL HELPERS
═══════════════════════════════════════════════════════════ */
function openModal(id)  {
  if (id === 'wallet-modal') {
    const btnMm = document.getElementById('btn-connect-mm');
    if (btnMm) btnMm.textContent = _wallet ? `Metamask Connected (${_wallet.slice(0,6)}...)` : 'Metamask';
    const btnFr = document.getElementById('btn-connect-fr');
    if (btnFr) btnFr.textContent = _freighterWallet ? `Freighter Connected (${_freighterWallet.slice(0,4)}...)` : 'Freighter';
  }
  document.getElementById(id)?.classList.add('open');
}
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function openArticle(id) {
  const article = ARTICLES.find(a => a.id === id);
  if (!article) return;
  
  const titleEl = document.getElementById('article-modal-title');
  if (titleEl) titleEl.innerHTML = `<span style="margin-right:8px">${article.icon}</span>${article.title}`;
  
  const bodyEl = document.getElementById('article-modal-body');
  if (bodyEl) bodyEl.innerHTML = article.content;
  
  openModal('article-modal');
}

/* ═══════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
═══════════════════════════════════════════════════════════ */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icon = type === 'success' ? ico('check', 16) : type === 'error' ? ico('error', 16) : ico('info', 16);
  t.innerHTML = `<span style="display:inline-flex;align-items:center;">${icon}</span><span>${message}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(24px)';
    setTimeout(() => t.remove(), 330);
  }, 4500);
}

/* ═══════════════════════════════════════════════════════════
   UTILITY
═══════════════════════════════════════════════════════════ */
function ls(key) { try { return localStorage.getItem(`j3_${_wallet}_${key}`) || ''; } catch { return ''; } }
function lsSet(key, val) { try { localStorage.setItem(`j3_${_wallet}_${key}`, val); } catch {} }

function getMood(score) { return MOODS.find(m => m.score === score) || MOODS[2]; }
function moodChipHtml(score) {
  const m = getMood(score);
  return `<span class="mood-chip" style="color:var(--ink);border-color:${m.color}80;background:${m.color}30;">
    <div style="width:14px;height:14px;margin-right:4px;">${m.svg}</div> ${m.label}
  </span>`;
}

function dayKey(date) { return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }
function fmtDateShort(d) { return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long' }); }
function fmtDateFull(d) { return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); }
function esc(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}

/* ═══════════════════════════════════════════════════════════
   STELLAR TRANSACTIONS
═══════════════════════════════════════════════════════════ */
async function handleStellarSend() {
  if (!_freighterWallet) {
    showToast('Freighter wallet not connected.', 'error');
    return;
  }
  
  const toInput = document.getElementById('stellar-tx-to').value.trim();
  const destination = toInput || _freighterWallet;
  const amountStr = document.getElementById('stellar-tx-amount').value.trim();
  
  if (!destination.startsWith('G') || destination.length !== 56) {
    showToast('Invalid Stellar destination address.', 'error');
    return;
  }
  
  const amountNum = parseFloat(amountStr);
  if (isNaN(amountNum) || amountNum <= 0) {
    showToast('Invalid amount.', 'error');
    return;
  }

  const btn = document.getElementById('stellar-send-btn');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="margin:0 auto;"></div>';

  try {
    const horizonUrl = _useTestnet ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org';
    const server = new StellarSdk.Horizon.Server(horizonUrl);
    
    // Check if destination exists
    try {
      await server.loadAccount(destination);
    } catch (e) {
      if (e.response && e.response.status === 404) {
        throw new Error(`Destination account does not exist on ${_useTestnet ? 'testnet' : 'mainnet'}.`);
      }
      throw e;
    }

    const sourceAccount = await server.loadAccount(_freighterWallet);
    const networkPassphrase = _useTestnet ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC;
    const networkStr = _useTestnet ? 'TESTNET' : 'PUBLIC';

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: await server.fetchBaseFee(),
      networkPassphrase
    })
    .addOperation(StellarSdk.Operation.payment({
      destination: destination,
      asset: StellarSdk.Asset.native(),
      amount: amountNum.toFixed(7)
    }))
    .setTimeout(30)
    .build();

    const xdr = tx.toXDR();
    
    const signRes = await window.freighterApi.signTransaction(xdr, {
      network: networkStr,
      networkPassphrase
    });
    
    if (signRes.error) throw new Error(signRes.error);
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(signRes.signedTxXdr, networkPassphrase);
    
    showToast('Transaction signed! Submitting to network...', 'info');
    
    const response = await server.submitTransaction(signedTx);
    
    const explorerBaseUrl = _useTestnet ? 'https://stellar.expert/explorer/testnet' : 'https://stellar.expert/explorer/public';
    const explorerUrl = `${explorerBaseUrl}/tx/${response.hash}`;
    showToast(`Success! <a href="${explorerUrl}" target="_blank" style="color:var(--ink);text-decoration:underline;">View on Explorer</a>`, 'success');
    
    document.getElementById('stellar-tx-to').value = '';
    document.getElementById('stellar-tx-amount').value = '1.0';
    
    await fetchXlmBalance();
  } catch (err) {
    console.error('Stellar TX Error:', err);
    showToast('Transaction failed: ' + (err.message || 'Unknown error'), 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

/* ─── Global Settings Actions ──────────────────────────────── */
function toggleNetworkMode(isTestnet) {
  localStorage.setItem('useTestnet', isTestnet);
  location.reload();
}
