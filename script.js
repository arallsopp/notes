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


/* vexflow score demo */
const { Renderer, Stave, StaveNote, Voice, Formatter } = Vex.Flow;

// Create an SVG renderer and attach it to the DIV element named "stave".
const div = document.getElementById("stave");
const renderer = new Renderer(div, Renderer.Backends.SVG);

// Configure the rendering context.
renderer.resize(500, 200);
const context = renderer.getContext();

// Create a stave of width 400 at position 10, 40 on the canvas.
const stave = new Stave(10, 40, 400);

// Add a clef and time signature.
stave.addClef("treble").addTimeSignature("4/4");

// Connect it to the rendering context and draw!
stave.setContext(context).draw();


const notes = [
    new StaveNote({
        keys: ["c/4"],
        duration: "w",
    }),
];

// Create a voice in 4/4 and add above notes
const voices = [
   new Voice({
        numBeats: 4,
        beatValue: 4,
    }).addTickables(notes),
];

new Formatter().joinVoices(voices).format(voices, 350);

// Render voices.
voices.forEach(function (v) {
    v.draw(context, stave);
});