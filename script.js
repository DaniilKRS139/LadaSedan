// --- ЗАВАНТАЖЕННЯ ДАНИХ ---
let savedData = {};
try { savedData = JSON.parse(localStorage.getItem('clickerSaveData')) || {}; } 
catch (e) { savedData = {}; }

let score = savedData.score !== undefined ? savedData.score : 0;
let playerState = savedData.playerState || {
    ownedSkins: ['default'],
    currentSkin: 'default',
    ownedClickerId: 0
};
let settings = savedData.settings || { music: true, sound: true };
let clickValue = 1; 

const skins = [
    { id: 'default', name: 'Стандарт', cost: 0, val: 1, img: null, sound: 'assets/click.mp3' },
    { id: 'metal', name: 'Метал', cost: 1000, val: 2, img: 'assets/metal.png', sound: 'assets/metal.mp3' },
    { id: 'magma', name: 'Магма', cost: 3500, val: 5, img: 'assets/magma.png', sound: 'assets/magma.mp3' },
    { id: 'neon', name: 'Неон', cost: 7000, val: 10, img: 'assets/neon.png', sound: 'assets/neon.mp3' }
];

const clickers = [
    { id: 1, name: 'Клікер v1 (5с)', cost: 500, time: 5000 },
    { id: 2, name: 'Клікер v2 (3с)', cost: 2500, time: 3000 },
    { id: 3, name: 'Клікер v3 (1.5с)', cost: 7000, time: 1500 },
    { id: 4, name: 'Клікер v4 (0.5с)', cost: 15000, time: 500 }
];

// --- АУДІО ---
const musicAudio = new Audio('assets/music.mp3'); 
musicAudio.loop = true; 
let musicStarted = false;

// --- DOM ---
const scoreEl = document.getElementById('score');
const autoScoreInfoEl = document.getElementById('auto-score-info'); // Новий елемент
const mainBtn = document.getElementById('main-button');
const shopSkinsContainer = document.getElementById('shop-skins');
const shopClickersContainer = document.getElementById('shop-clickers');
const btnMusic = document.getElementById('toggle-music');
const btnSound = document.getElementById('toggle-sound');

function saveGame() {
    localStorage.setItem('clickerSaveData', JSON.stringify({ score, playerState, settings }));
}

// --- ВІЗУАЛЬНІ ЕФЕКТИ ---

// 1. Цифри від пальця гравця (там де клікнув)
function showFloatingText(x, y) {
    const el = document.createElement('div');
    el.innerText = '+' + clickValue;
    el.className = 'floating-text';
    const randomX = (Math.random() - 0.5) * 40; 
    el.style.left = (x + randomX) + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

// 2. Цифри від автоклікера (ТІЛЬКИ ПО КРАЯХ)
function showAutoClickText() {
    const el = document.createElement('div');
    el.innerText = '+' + clickValue;
    el.className = 'auto-floating-text'; // Інший стиль (жовтий)
    
    // Вираховуємо безпечні зони
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Відступи: зверху 100px (меню), знизу 150px (рахунок)
    const minY = 100;
    const maxY = screenHeight - 150;
    
    // Випадкова позиція по вертикалі в безпечній зоні
    const randomY = Math.random() * (maxY - minY) + minY;
    
    // Випадкова сторона: Або лівий край (20px), Або правий край (width - 60px)
    const isLeft = Math.random() > 0.5;
    const randomX = isLeft ? 20 : (screenWidth - 60);
    
    el.style.left = randomX + 'px';
    el.style.top = randomY + 'px';
    
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

// --- ФУНКЦІЇ ГРИ ---
function playClickSound() {
    if (settings.sound) {
        const currentSkinData = skins.find(s => s.id === playerState.currentSkin);
        const soundFile = currentSkinData ? currentSkinData.sound : 'assets/click.mp3';
        const sfx = new Audio(soundFile);
        sfx.volume = 0.5;
        sfx.play().catch(e => {}); 
    }
}

function checkMusic() {
    if (settings.music && !musicStarted) {
        musicAudio.play().then(() => { musicStarted = true; }).catch(e => {});
    } else if (!settings.music) musicAudio.pause();
}

function animateButton() {
    mainBtn.classList.remove('pressed'); 
    void mainBtn.offsetWidth; 
    mainBtn.classList.add('pressed');
    setTimeout(() => mainBtn.classList.remove('pressed'), 80);
}

function handleInteraction(e) {
    addScore(clickValue);
    playClickSound();
    checkMusic();
    animateButton();
    
    let x, y;
    if (e.type === 'touchstart') {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
    } else {
        x = e.clientX;
        y = e.clientY;
    }
    showFloatingText(x, y);
}

mainBtn.addEventListener('mousedown', (e) => handleInteraction(e));
mainBtn.addEventListener('touchstart', (e) => { 
    e.preventDefault(); 
    handleInteraction(e); 
});

function addScore(amount) {
    score += amount;
    updateDisplay();
    saveGame(); 
}

function updateDisplay() {
    scoreEl.innerText = Math.floor(score);
    
    // Оновлюємо інформацію про автоклікер під рахунком
    if (playerState.ownedClickerId > 0) {
        autoScoreInfoEl.classList.remove('hidden');
        // Знаходимо поточний клікер
        const currentClicker = clickers.find(c => c.id === playerState.ownedClickerId);
        // Скільки дає за раз (залежить від скіна)
        autoScoreInfoEl.innerText = `🤖 Авто: +${clickValue} / ${currentClicker.time/1000}с`;
    } else {
        autoScoreInfoEl.classList.add('hidden');
    }
    
    updateShopUI();
}

let autoClickTimer = null;
function runAutoClickerLogic() {
    if (autoClickTimer) clearInterval(autoClickTimer);
    if (playerState.ownedClickerId > 0) {
        const bestClicker = clickers.find(c => c.id === playerState.ownedClickerId);
        if (bestClicker) {
            autoClickTimer = setInterval(() => {
                // Додаємо очки
                addScore(clickValue);
                // Показуємо цифри по краях
                showAutoClickText(); 
            }, bestClicker.time);
        }
    }
}

function equipSkin(id) {
    playerState.currentSkin = id;
    const skinData = skins.find(s => s.id === id);
    
    mainBtn.className = 'click-btn';
    mainBtn.classList.add('skin-' + id);
    
    if (skinData.img) {
        mainBtn.style.backgroundImage = `url('${skinData.img}')`;
        if(id === 'metal') mainBtn.style.border = '4px solid silver';
        else if(id === 'magma') mainBtn.style.border = '4px solid #ff4500';
        else if(id === 'neon') mainBtn.style.border = '4px solid #0ff';
        else mainBtn.style.border = 'none';
    } else {
        mainBtn.style.backgroundImage = 'none';
        mainBtn.style.border = 'none';
    }
    
    clickValue = skinData.val;
    saveGame();
    updateDisplay();
    // Перезапускаємо клікер, щоб оновити напис знизу
    if (playerState.ownedClickerId > 0) runAutoClickerLogic();
}

function initShop() {
    shopSkinsContainer.innerHTML = '';
    skins.forEach(skin => {
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `<span>${skin.name} (+${skin.val})</span>
            <button id="btn-skin-${skin.id}" onclick="buyOrEquipSkin('${skin.id}')">...</button>`;
        shopSkinsContainer.appendChild(div);
    });
    shopClickersContainer.innerHTML = '';
    clickers.forEach(clicker => {
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `<span>${clicker.name}</span>
            <button id="btn-clicker-${clicker.id}" onclick="buyClicker(${clicker.id})">...</button>`;
        shopClickersContainer.appendChild(div);
    });
    updateDisplay();
}

window.buyOrEquipSkin = function(id) {
    const skin = skins.find(s => s.id === id);
    if (playerState.ownedSkins.includes(id)) equipSkin(id);
    else if (score >= skin.cost) {
        score -= skin.cost;
        playerState.ownedSkins.push(id);
        equipSkin(id);
    }
};

window.buyClicker = function(id) {
    const clicker = clickers.find(c => c.id === id);
    if (score >= clicker.cost && id > playerState.ownedClickerId) {
        score -= clicker.cost;
        playerState.ownedClickerId = id;
        runAutoClickerLogic();
        saveGame();
        updateDisplay();
    }
};

function updateShopUI() {
    skins.forEach(skin => {
        const btn = document.getElementById(`btn-skin-${skin.id}`);
        if(!btn) return;
        if (playerState.ownedSkins.includes(skin.id)) {
            btn.innerText = (playerState.currentSkin === skin.id) ? "Вдягнуто" : "Вдягнути";
            btn.disabled = (playerState.currentSkin === skin.id);
            btn.style.background = (playerState.currentSkin === skin.id) ? "#555" : "#2196F3";
        } else {
            btn.innerText = skin.cost;
            btn.disabled = score < skin.cost;
            btn.style.background = score < skin.cost ? "#555" : "#4CAF50";
        }
    });
    clickers.forEach(clicker => {
        const btn = document.getElementById(`btn-clicker-${clicker.id}`);
        if(!btn) return;
        if (clicker.id <= playerState.ownedClickerId) {
            btn.innerText = "Куплено";
            btn.disabled = true; btn.style.background = "#555";
        } else {
            btn.innerText = clicker.cost;
            btn.disabled = score < clicker.cost;
            btn.style.background = score < clicker.cost ? "#555" : "#4CAF50";
        }
    });
}

window.devAddPoints = function() { addScore(1000); };
window.devResetProgress = function() { 
    if(confirm('Скинути все?')) {
        if (autoClickTimer) clearInterval(autoClickTimer);
        localStorage.clear();
        location.reload(); 
    }
};

const modalSettings = document.getElementById('modal-settings');
const modalShop = document.getElementById('modal-shop');
document.getElementById('btn-settings').onclick = toggleSettings;
document.getElementById('btn-shop').onclick = toggleShop;

function toggleSettings() { modalSettings.classList.toggle('hidden'); btnMusic.innerText = `Музика: ${settings.music ? "УВІМК" : "ВИМК"}`; btnSound.innerText = `Звук: ${settings.sound ? "УВІМК" : "ВИМК"}`; }
function toggleShop() { modalShop.classList.toggle('hidden'); }
btnMusic.onclick = () => { settings.music = !settings.music; btnMusic.innerText = `Музика: ${settings.music ? "УВІМК" : "ВИМК"}`; if(settings.music) { musicAudio.play().catch(()=>{}); musicStarted = true; } else { musicAudio.pause(); } saveGame(); };
btnSound.onclick = () => { settings.sound = !settings.sound; btnSound.innerText = `Звук: ${settings.sound ? "УВІМК" : "ВИМК"}`; saveGame(); };

initShop();
equipSkin(playerState.currentSkin);
runAutoClickerLogic();
