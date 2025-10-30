// Tab switching
document.querySelectorAll('.menu button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.menu button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// Mining system
let mining = false;
let progress = 0;
let timer;
const duration = 8 * 60 * 60; // 8 hours in seconds

document.getElementById('start-mining').addEventListener('click', () => {
  mining = true;
  progress = 0;
  document.getElementById('start-mining').classList.add('hidden');
  document.getElementById('mining-info').textContent = "Đang khai thác...";
  timer = setInterval(updateMining, 1000);
});

function updateMining() {
  progress++;
  const percent = Math.min((progress / duration) * 100, 100);
  document.getElementById('progress-bar').style.width = percent + "%";
  document.getElementById('mining-info').textContent = `Khai thác: ${percent.toFixed(2)}% (${(progress/3600).toFixed(2)}h / 8h)`;

  if (progress >= duration) {
    clearInterval(timer);
    document.getElementById('claim-ym').classList.remove('hidden');
    document.getElementById('mining-info').textContent = "Cây đầy! Claim $YM ngay!";
  }
}

// Wallet Deposit
const depositBox = document.getElementById('deposit-box');
document.getElementById('deposit-btn').addEventListener('click', () => depositBox.classList.remove('hidden'));
document.getElementById('close-deposit').addEventListener('click', () => depositBox.classList.add('hidden'));

const networkImages = {
  TRC20: "assets/qr/trc20.png",
  BEP20: "assets/qr/bep20.png",
  ERC20: "assets/qr/erc20.png"
};

const walletAddresses = {
  TRC20: "TApLqzZ5gUPxkzRW8Ym1XYZ...",
  BEP20: "0xBep20WalletAddressExample...",
  ERC20: "0xErc20WalletAddressExample..."
};

document.querySelectorAll('.network-list button').forEach(btn => {
  btn.addEventListener('click', () => {
    const net = btn.dataset.net;
    document.getElementById('deposit-details').classList.remove('hidden');
    document.getElementById('qr-img').src = networkImages[net];
    document.getElementById('wallet-address').textContent = walletAddresses[net];
  });
});

// Withdraw & Swap
document.getElementById('withdraw-btn').addEventListener('click', () => {
  document.getElementById('withdraw-box').classList.remove('hidden');
});
document.getElementById('close-withdraw').addEventListener('click', () => {
  document.getElementById('withdraw-box').classList.add('hidden');
});

document.getElementById('swap-btn').addEventListener('click', () => {
  document.getElementById('swap-box').classList.remove('hidden');
});
document.getElementById('close-swap').addEventListener('click', () => {
  document.getElementById('swap-box').classList.add('hidden');
});
