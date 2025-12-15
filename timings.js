let samWidth = null;  //global var for tracking size against anims.


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
let browResetTimeout = null;
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


function updateSamLayout() {
    const grid = document.querySelector("#grid");
    const sam = document.querySelector("#sam");
    if (!grid || !sam) return;

    const gridRect = grid.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const SAM_MIN_CLEARANCE = 120; // minimum space below grid to show Sam
    const SAM_MULTIPLIER = 0.76;   // scales downward movement

    // compute free space below grid
    const spaceBelow = viewportHeight - (gridRect.top + gridRect.height);

    // determine visibility
    const showSam = spaceBelow >= SAM_MIN_CLEARANCE;
    sam.style.display = showSam ? "block" : "none";
    if (!showSam) return;

    // scale sam's width based upon actual free space
    let width = spaceBelow * SAM_MULTIPLIER;

    console.log(`grid height is ${viewportHeight-spaceBelow}, space below grid is ${spaceBelow}`);
    console.log(`width is ${width}, space below is ${spaceBelow} and mutiplier is ${SAM_MULTIPLIER}`);

    sam.style.width = `${width}px`;
    sam.style.left = "50%";
    sam.style.transform = "translateX(-50%)";

    //store the width for animation of eyes and brows
    samWidth = width;
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
function playBop(freq, accent) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain(),
        gain_value = accent ? 0.35 : 0.18,
        duration = accent ? 0.12 : 0.08

    osc.frequency.value = freq;

    //accents are slightly louder and slightly longer
    gain.gain.value = gain_value;

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
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
const timeSignatureSelect = document.getElementById("time-signature");

const playBtn = document.getElementById("playBtn");
const playBtnSpan = playBtn.querySelector("span");


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

    //format the borders for wide grids
    const gridEl = document.querySelector("#grid");
    gridEl.classList.toggle("thin-borders", gridSize > 12);

    updateSamLayout();

    return { gridSize, leftHits, rightHits };
}

function togglePlayback(state) {
    if (typeof state == "undefined") {
        state = !timer;
    }

    if (!state){
        clearInterval(timer);
        timer = null;
        playBtnSpan.textContent = "Play";
    }else {
        unlockAudio(); // explicitly unlocks audio on user gesture
        startPlayback();
        playBtnSpan.textContent = "Stop";
    }
}
// ------------------------------------------------------------
// Playback loop
// ------------------------------------------------------------
function startPlayback() {
    const bpm = parseInt(tempoInput.value, 10);
    const timeSig = document.getElementById("time-signature").value; // e.g., "6/8"

    const [numerator, denominator] = timeSig.split("/").map(Number);

    // Determine beats per bar and beat unit
    // Standard convention:
    // - For 4/4, 3/4 → quarter note is 1 beat
    // - For 6/8, 12/8 → dotted quarter note is 1 beat
    let beatsPerBar, beatUnit; // beatUnit is fraction of whole note

    if (denominator === 8 && numerator % 3 === 0) {
        // compound time
        beatsPerBar = numerator / 3;        // e.g., 6/8 -> 2 beats per bar
        beatUnit = 3 / 8;                   // dotted quarter = 3 eighths
    } else {
        // simple time
        beatsPerBar = numerator;
        beatUnit = 1 / denominator;         // e.g., quarter note = 1/4
    }
    console.log(`bpm: ${bpm}, timeSig: ${timeSig}, beatsPerBar: ${beatsPerBar}, beatUnit: ${beatUnit}`);
    const { gridSize, leftHits, rightHits } = rebuildGrid();

    if (timer) clearTimeout(timer);
    currentStep = 0;

    // Calculate steps per beat
    const stepsPerBeat = gridSize / beatsPerBar;

    // Step duration in ms
    let stepDuration = (60000 / bpm) / stepsPerBeat;

    function step() {
        // Clear highlights
        cellRefs.flat().forEach(c => c.classList.remove("active"));

        // First step of bar
        const isBarStart = currentStep % gridSize === 0;

        // Left hand
        cellRefs[0][currentStep].classList.add("active");
        if (leftHits.includes(currentStep)) {
            playBop(240, isBarStart);
        }

        // Right hand
        cellRefs[1][currentStep].classList.add("active");
        if (rightHits.includes(currentStep)) {
            playBop(400, isBarStart);
        }

        // Animate eyes/brows
        bopEyes(leftHits.includes(currentStep), rightHits.includes(currentStep), isBarStart);

        currentStep = (currentStep + 1) % gridSize;
    }

    // Recursive timeout for dynamic tempo
    function scheduleNext() {
        step();
        // recalc in case tempo changes dynamically
        const bpmNow = parseInt(tempoInput.value, 10);
        stepDuration = (60000 / bpmNow) / stepsPerBeat;
        timer = setTimeout(scheduleNext, stepDuration);
    }

    // Start immediately
    step();
    timer = setTimeout(scheduleNext, stepDuration);
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

timeSignatureSelect.addEventListener("change", () => {
    if (timer) clearTimeout(timer); // stop playback
    startPlayback();               // restart with new beats per bar
});

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
            updateSamLayout();
        }, 900);
    }, 1400);

});

/* eyes anim */
let eyes = document.querySelector(".eyes"),
    brows = document.querySelector(".brows");



function bopEyes(leftBeat,rightBeat, zeroBeat) {
    if (!eyes) return;

    console.log(`bopping eyes based upon a width of ${samWidth}`);
    if (leftBeat && rightBeat) {
        eyes.style.transform = `translateX(0px)`;
    } else if (leftBeat) {
        eyes.style.transform = `translateX(${-samWidth * 0.05}px)`;
    } else if (rightBeat) {
        eyes.style.transform = `translateX(${samWidth * 0.04}px)`;
    }

    if (zeroBeat) {
        // Raise brows immediately
        brows.style.transform = `translateY(${-samWidth * 0.05}px)`;

        // Cancel any previous reset
        if (browResetTimeout) {
            clearTimeout(browResetTimeout);
        }

        // Schedule reset
        browResetTimeout = setTimeout(() => {
            brows.style.transform = "translateY(0)";
            browResetTimeout = null;
        }, 160);
    }
}

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) handleFocusReturn();
});

window.addEventListener("focus", handleFocusReturn);

window.addEventListener("resize", updateSamLayout);

document.getElementById("audio-restart").addEventListener("click", () => {
    unlockAudio();
    hideAudioRecoveryUI();
});


/* handle about box */
const aboutToggle = document.getElementById("about-toggle");
const aboutBox = document.getElementById("about-box");

aboutToggle.addEventListener("click", () => {
    const isOpen = aboutBox.style.display === "block";

    aboutBox.style.display = isOpen ? "none" : "block";
    aboutToggle.textContent = isOpen ? "?" : "×";
});

