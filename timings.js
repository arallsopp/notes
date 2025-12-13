// ------------------------------------------------------------
// Utility: GCD / LCM
// ------------------------------------------------------------
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function lcm(a, b) { return (a * b) / gcd(a, b); }

// ------------------------------------------------------------
// Expand pattern to grid hits
// divisions = number of hits per beat
// gridSize = LCM
// ------------------------------------------------------------
function expand(divisions, gridSize) {
    const hits = [];
    const step = gridSize / divisions;
    for (let i = 0; i < divisions; i++) {
        hits.push(Math.round(i * step));
    }
    return hits;
}

// ------------------------------------------------------------
// WebAudio: two different “bops”
// ------------------------------------------------------------
let audioCtx = null;
let masterGain = null;
let lastAudioTick = 0;

function audioHeartbeat() {
    const ctx = getAudioContext();
    if (ctx.state !== "running") return;

    const osc = ctx.createOscillator();
    osc.frequency.value = 1; // sub-audible
    osc.connect(masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.01);

    lastAudioTick = performance.now();
}


function showAudioRecoveryUI() {
    document.getElementById("audio-restart").hidden = false;
}

function hideAudioRecoveryUI() {
    document.getElementById("audio-restart").hidden = true;
}

function getAudioContext() {
    if (!audioCtx || audioCtx.state === "closed") {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.connect(audioCtx.destination);
    }
    return audioCtx;
}

function handleFocusReturn() {
    if (audioCtx && audioCtx.state !== "running") {
        showAudioRecoveryUI();
    }
}
function unlockAudio() {
    const ctx = getAudioContext();

    if (ctx.state === "suspended") {
        ctx.resume();
    }

    // Hard reset if needed
    if (ctx.state === "closed") {
        audioCtx = null;
        getAudioContext();
    }

    // Silent unlock pulse
    const buffer = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(masterGain);
    src.start();
}
function playBop(freq) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.frequency.value = freq;
    gain.gain.value = 0.9;

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    osc.stop(audioCtx.currentTime + 0.12);
}

// Left hand = 240Hz bop
// Right hand = 400Hz bop

// ------------------------------------------------------------
// Main grid engine
// ------------------------------------------------------------
const grid = document.getElementById("grid");
const leftSelect = document.getElementById("leftSelect");
const rightSelect = document.getElementById("rightSelect");
const tempoInput = document.getElementById("tempo");
const playBtn = document.getElementById("playBtn");

let cellRefs = [];
let timer = null;
let currentStep = 0;

// ------------------------------------------------------------
// Build grid when dropdowns change
// ------------------------------------------------------------
function rebuildGrid() {
    const leftDiv = parseInt(leftSelect.value, 10);
    const rightDiv = parseInt(rightSelect.value, 10);

    const gridSize = lcm(leftDiv, rightDiv);  // LCM per beat

    const leftHits = expand(leftDiv, gridSize);
    const rightHits = expand(rightDiv, gridSize);

    // Build DOM grid
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(2, 1fr)`;

    cellRefs = [[], []];

    // Row 0 = left hand, Row 1 = right hand
    [leftHits, rightHits].forEach((hits, rowIdx) => {
        for (let col = 0; col < gridSize; col++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            if (hits.includes(col)) cell.classList.add("hit");
            grid.appendChild(cell);
            cellRefs[rowIdx].push(cell);
        }
    });

    return { gridSize, leftHits, rightHits };
}

function togglePlayback(state) {
    if (typeof state == "undefined") {
        state = !timer;
    }

    if (!state){
        clearInterval(timer);
        timer = null;
    }else {
        unlockAudio(); // explicitly unlocks audio on user gesture
        startPlayback();
    }
}
// ------------------------------------------------------------
// Playback loop
// ------------------------------------------------------------
function startPlayback() {
    const bpm = parseInt(tempoInput.value, 10);

    const { gridSize, leftHits, rightHits } = rebuildGrid();

    if (timer) clearInterval(timer);
    currentStep = 0;

    const interval = (60000 / bpm) / gridSize; // beat subdivided into gridSize parts

    function step() {
        // clear all highlights
        cellRefs.flat().forEach(c => c.classList.remove("active"));

        // play left hand?
        if (leftHits.includes(currentStep)) {
            playBop(240);
            cellRefs[0][currentStep].classList.add("active");
        }

        // play right hand?
        if (rightHits.includes(currentStep)) {
            playBop(400);
            cellRefs[1][currentStep].classList.add("active");
        }

        currentStep = (currentStep + 1) % gridSize;
    }

    step();
    timer = setInterval(step, interval);
}

// Auto rebuild grid initially
rebuildGrid();

// Rebuild when dropdowns change
leftSelect.addEventListener("change", function(){
    rebuildGrid();
    togglePlayback(false);
});

rightSelect.addEventListener("change", function(){
    rebuildGrid();
    togglePlayback(false);
});
tempoInput.addEventListener("change", startPlayback);
playBtn.addEventListener("click", function(){
    togglePlayback()
});

//load animation
window.addEventListener("load", () => {
    setTimeout(() => {
        const screen = document.getElementById("loading-screen");
        screen.classList.add("closing");

        setTimeout(() => {
            screen.remove();
            document.getElementById("app").classList.remove("hidden");
        }, 900);
    }, 1400);
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) handleFocusReturn();
});

window.addEventListener("focus", handleFocusReturn);

document.getElementById("audio-restart").addEventListener("click", () => {
    unlockAudio();
    hideAudioRecoveryUI();
});
