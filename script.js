const keys = document.querySelectorAll('.piano-keys');
const answer = document.getElementById('answer');

// Collect all available note names from the keys
const availableNotes = Array.from(keys).map(k => k.dataset.key);

// Pick a random target note
let targetNote = getRandomNoteExcept();
answer.innerText = 'Find: ' + targetNote;
console.log('Target note:', targetNote);

function getRandomNoteExcept(targetNote) {
    let note, randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * availableNotes.length);
        note = availableNotes[randomIndex];
    }while(note === targetNote);
    return note;
}

// Add listeners
keys.forEach((key) => {
    key.addEventListener('click', (e) => {
        const clickedNote = e.target.dataset.key;

        if (clickedNote === targetNote) {
            flashKey(e.target, 'green');
            console.log('✅ Correct! It was', clickedNote);
            // Pick a new note
            targetNote = getRandomNoteExcept(targetNote);
            answer.innerText = 'Find: ' + targetNote;
            console.log('Next note:', targetNote);
        } else {
            flashKey(e.target, 'red');
            console.log('❌ Wrong. Try again.');
        }
    });
});

function flashKey(keyEl, color) {
    const originalColor = keyEl.classList.contains('white-key') ? '#fff' : '#000';
    keyEl.style.backgroundColor = color;
    keyEl.style.transition = 'background-color 0.2s';
    setTimeout(() => {
        keyEl.style.backgroundColor = originalColor;
    }, 300);
}


/* easy score demo */
const { Factory, EasyScore, System } = Vex.Flow;

const vf = new Factory({
    renderer: { elementId: 'stave', width: 500, height: 200 },
});

const score = vf.EasyScore();
const system = vf.System();

system
    .addStave({
        voices: [
            score.voice(score.notes('C#5/q, B4, A4, G#4', { stem: 'up' })),
            score.voice(score.notes('C#4/h, C#4', { stem: 'down' })),
        ],
    })
    .addClef('treble')
    .addTimeSignature('4/4');

vf.draw();