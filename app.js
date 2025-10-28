const tg = window.Telegram.WebApp;
tg.ready();

const CASES = {
  common: { price: 20, nftChance: 2, nftValue: 30, prizeRange: [5,20], specialNftChance: 0.5 },
  rare:   { price: 60, nftChance: 3, nftValue: 80, prizeRange: [20,60], specialNftChance: 1 },
  mythical:{ price:120, nftChance: 4, nftValue: 200, prizeRange: [50,120], specialNftChance: 2 },
  legendary:{ price:220, nftChance: 6, nftValue: 400, prizeRange: [100,220], specialNftChance: 3 }
};

let userBalance = 0;
let selectedCase = 'common';

const balanceDiv = document.getElementById('balance');
const casesContainer = document.getElementById('cases');
const caseSelect = document.getElementById('caseSelect');
const openBtn = document.getElementById('openBtn');
const resultBox = document.getElementById('result');
const rewardEl = document.getElementById('reward');
const closeBtn = document.getElementById('closeBtn');
const connectTonBtn = document.getElementById('connectTon');

function renderCases(){
  casesContainer.innerHTML = '';
  caseSelect.innerHTML = '';
  Object.keys(CASES).forEach(key=>{
    const cfg = CASES[key];
    const card = document.createElement('div');
    card.className = 'case-card';
    card.dataset.type = key;
    if(key==='legendary') card.style.background = 'linear-gradient(180deg,#fff8f0,#fff4f4)';
    card.innerHTML = `<div class="case-title">${capitalize(key)}</div>
      <div class="case-price">${cfg.price} ❤️</div>
      <div class="case-sub">Шанс NFT: ${cfg.nftChance}% • Приз: ${cfg.prizeRange[0]}–${cfg.prizeRange[1]} ❤️</div>`;
    card.addEventListener('click', ()=>selectCase(key, card));
    casesContainer.appendChild(card);

    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = `${capitalize(key)} — ${cfg.price} ❤️`;
    caseSelect.appendChild(opt);
  });
  selectCase(selectedCase, casesContainer.querySelector('[data-type="'+selectedCase+'"]'));
}
function selectCase(key, cardEl){
  selectedCase = key;
  casesContainer.querySelectorAll('.case-card').forEach(c=>c.classList.remove('case-selected'));
  if(cardEl) cardEl.classList.add('case-selected');
  caseSelect.value = key;
  updateOpenButton();
}
function capitalize(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
function randomInt(min,max){ return Math.floor(Math.random()*(max-min+1)+min); }

function getPrize(caseKey){
  const cfg = CASES[caseKey];
  const r = Math.random()*100;
  if(r <= cfg.nftChance){
    const r2 = Math.random()*100;
    if(r2 <= cfg.specialNftChance){
      return { type: 'nft', value: cfg.nftValue, id: `${caseKey.toUpperCase()}-TOP-${Date.now()}` };
    } else {
      return { type: 'nft', value: Math.floor(cfg.nftValue/2), id: `${caseKey.toUpperCase()}-NFT-${Date.now()}` };
    }
  } else {
    const amt = randomInt(cfg.prizeRange[0], cfg.prizeRange[1]);
    return { type: 'hearts', value: amt };
  }
}

function updateBalanceUI(){
  balanceDiv.innerText = `❤️ ${userBalance}`;
  updateOpenButton();
}
function updateOpenButton(){
  const price = CASES[selectedCase].price;
  if(userBalance < price){
    openBtn.disabled = true;
    openBtn.textContent = `Потрібно ${price} ❤️`;
    openBtn.classList.remove('primary');
  } else {
    openBtn.disabled = false;
    openBtn.textContent = `Відкрити ${capitalize(selectedCase)} (${price} ❤️)`;
    openBtn.classList.add('primary');
  }
}

function requestBalanceFromBot(){
  try{ tg.sendData(JSON.stringify({ action: 'request_balance' })); }
  catch(e){ console.warn('sendData error', e); }
}

async function openCase(){
  const cfg = CASES[selectedCase];
  if(userBalance < cfg.price){ alert('Недостатньо ❤️'); return; }
  openBtn.disabled = true;
  openBtn.textContent = 'Крутиться...';
  const prize = getPrize(selectedCase);
  const payload = {
    action: 'open_case',
    case: selectedCase,
    attemptedPrice: cfg.price,
    prize: prize,
    tg
User: tg.initDataUnsafe && tg.initDataUnsafe.user ? { id: tg.initDataUnsafe.user.id, name: tg.initDataUnsafe.user.first_name } : null
  };

  try{ tg.sendData(JSON.stringify(payload)); }
  catch(e){ console.warn('sendData error', e); }

  userBalance -= cfg.price;
  if(prize.type === 'hearts'){ userBalance += prize.value; }
  updateBalanceUI();

  rewardEl.textContent = prize.type === 'hearts' ? `${prize.value} ❤️` : `NFT (${prize.id}) — вартість ${prize.value} ❤️`;
  resultBox.classList.remove('hidden');

  setTimeout(()=>{
    openBtn.disabled = false;
    updateOpenButton();
  }, 900);
}

let tonConnector = null;
async function tonConnectInit(){
  try{
    if(typeof window.TonConnect === 'undefined'){
      connectTonBtn.innerText = 'TON недоступний';
      return;
    }
    tonConnector = new window.TonConnect.TonConnect({ manifestUrl: window.location.origin + '/tonconnect-manifest.json' });
    const app = await tonConnector.connect();
    connectTonBtn.innerText = 'TON: підключено';
    console.log('TON connected', app);
  }catch(e){
    console.error('TonConnect init error', e);
    connectTonBtn.innerText = 'Помилка TON';
  }
}

openBtn.addEventListener('click', openCase);
closeBtn.addEventListener && closeBtn.addEventListener('click', ()=>{ resultBox.classList.add('hidden'); });
caseSelect.addEventListener('change', ()=>selectCase(caseSelect.value, casesContainer.querySelector('[data-type="'+caseSelect.value+'"]')));
connectTonBtn.addEventListener('click', tonConnectInit);

renderCases();
updateBalanceUI();
requestBalanceFromBot();