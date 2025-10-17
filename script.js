const keys = document.querySelectorAll('.piano-keys');
const keyboard = [
    {color:"white", note:"C", octave:3},
    {color:"black", note:"C#", octave:3, altname: "Db"},
    {color:"white", note:"C", octave:3},
    {color:"black", note:"C#", octave:3, altname:"Db"},
    {color:"white", note:"D", octave:3},
    {color:"black", note:"D#", octave:3, altname:"Eb"},
    {color:"white", note:"E", octave:3},
    {color:"white", note:"F", octave:3},
    {color:"black", note:"F#", octave:3, altname:"Gb"},
    {color:"white", note:"G", octave:3},
    {color:"black", note:"G#", octave:3, altname:"Ab"},
    {color:"white", note:"A", octave:3},
    {color:"black", note:"A#", octave:3, altname:"Bb"},
    {color:"white", note:"B", octave:3},
    {color:"white", note:"C", octave:4},
    {color:"black", note:"C#", octave:4, altname:"Db"},
    {color:"white", note:"D", octave:4},
    {color:"black", note:"D#", octave:4, altname:"Eb"},
    {color:"white", note:"E", octave:4},
    {color:"white", note:"F", octave:4},
    {color:"black", note:"F#", octave:4, altname:"Gb"},
    {color:"white", note:"G", octave:4},
    {color:"black", note:"G#", octave:4, altname:"Ab"},
    {color:"white", note:"A", octave:4},
    {color:"black", note:"A#", octave:4, altname:"Bb"},
    {color:"white", note:"B", octave:4},
    {color:"white", note:"C", octave:5},
    {color:"black", note:"C#", octave:5, altname:"Db"},
    {color:"white", note:"D", octave:5},
    {color:"black", note:"D#", octave:5, altname:"Eb"},
    {color:"white", note:"E", octave:5}
    ]
;

const answer = document.getElementById('answer');
const controls = {
    showNoteName: document.getElementById('showNoteName'),
    useBassClef: document.getElementById('useBassClef'),
    allowSharps: document.getElementById('allowSharps'),
    allowFlats: document.getElementById('allowFlats'),
    allowSound: document.getElementById('allowSound')
};
let game = {
    targetNote:null
}

function setTargetNote() {
    let note, randomIndex, sourceArray;
    if(controls.allowSharps.checked || controls.allowFlats.checked){
        //include them all
        sourceArray = keyboard;
    }else{
        //just naturals
        sourceArray = keyboard.filter(key => !key.note.includes('#'));
    }
    console.log('Source array:', sourceArray);
    do {
        //pick a note
        randomIndex = Math.floor(Math.random() * sourceArray.length);

        //assign the note
        note = sourceArray[randomIndex].note;

        if(note.includes("#")) {
            //we might be expressing this as a # or a b
            if (controls.allowFlats.checked && controls.allowSharps.checked) {
                //either # or b is ok, switch randomly
                if (Math.random() >= 0.5) {
                    note = sourceArray[randomIndex].altname;
                }
            } else if (controls.allowFlats.checked) {
                //we are only allowing flats
                note = sourceArray[randomIndex].altname;
            }
        }
    }while(note === game.targetNote); //avoid the same note

    game.targetNote = note;
    console.log('Target note:', game.targetNote);
}

// Add listeners
keys.forEach((key) => {
    key.addEventListener('click', (e) => {
        const clickedNote = e.target.dataset.key;
        const altName = e.target.dataset.altKey;

        if(controls.allowSound.checked) {
            playNote(clickedNote + e.target.dataset.octave);
        }

        if (clickedNote === game.targetNote || altName === game.targetNote) {
            flashKey(e.target, 'green');
            console.log('✅ Correct! It was', clickedNote);

            if(controls.allowSound.checked) {
                setTimeout(() => {
                    setupForNewNote();
                }, 400); //after the note is played.
            }else{
                setupForNewNote();
            }

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


/* vexflow score integration */
const { Renderer, Stave, StaveNote, Voice, Formatter } = Vex.Flow;

// Create an SVG renderer and attach it to the DIV element named "stave".
const div = document.getElementById("stave");
const renderer = new Renderer(div, Renderer.Backends.SVG);

// Configure the rendering context.
renderer.resize(500, 110);
const context = renderer.getContext();

function createNote(note) {
    console.log('Creating note:', note);
    let octave_offset = (Math.floor(Math.random() * 2)),
        octave = (controls.useBassClef.checked ? 2 : 4) + octave_offset,
        new_note = note.toLowerCase();
    return [new StaveNote({
        clef: (controls.useBassClef.checked ? "bass" : "treble"),
        keys: [`${new_note}/${octave}`],
        duration: 'w',
        auto_accidentals: true
    })]
}

function drawStave() {
    //remove the existing stave so that we can draw a new one
    context.clearRect(0, 0, 500, 200);

    // Create a stave of width 400 at position 10, 40 on the canvas.
    const stave = new Stave(10, 0, 470);
    let clef = (controls.useBassClef.checked ? "bass" : "treble");

    // Add a clef and time signature.
    stave.addClef(clef).addTimeSignature("4/4");

    // Connect it to the rendering context and draw!
    stave.setContext(context).draw();

    // Create a voice in 4/4 and add above note(s)
    const voices = [
        new Voice({
            numBeats: 4,
            beatValue: 4,
        }).addTickables(createNote(game.targetNote))
    ];

    Vex.Flow.Accidental.applyAccidentals(voices, 'C');
    new Formatter().joinVoices(voices).format(voices, 350);

    // Render voices.
    voices.forEach(function (v) {
        v.draw(context, stave);
    });
}

// Pick a random target note
setupForNewNote();
drawStave();

function setupForNewNote(){
    setTargetNote();
    answer.style.display = (controls.showNoteName.checked ? 'block' : 'none');
    answer.innerText = 'Find' + (controls.showNoteName.checked ? `: ${game.targetNote}` : ' the note');
    console.log('Next note:', game.targetNote);
    drawStave();
}

/* pick a new note if we are changing sharps or clef */
document.getElementById('useBassClef').addEventListener('change', () => {
    setupForNewNote();
});
document.getElementById('allowSharps').addEventListener('change', () => {
    setupForNewNote();
});
document.getElementById('allowFlats').addEventListener('change', () => {
    setupForNewNote();
});


/* lets try playing the noise  */
function noteToFrequency(noteStr) {
    const noteSemitoneMap = {
        'C': 0,  'C#': 1,
        'D': 2,  'D#': 3,
        'E': 4,
        'F': 5,  'F#': 6,
        'G': 7,  'G#': 8,
        'A': 9,  'A#': 10,
        'B': 11
    };

    // Extract note and octave from input like "D#5"
    const match = noteStr.match(/^([A-G]#?)(\d)$/);
    if (!match) {
        throw new Error("Invalid note format. Use format like 'C4', 'A#3', etc.");
    }

    const [, note, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);

    const semitoneOffsetFromC = noteSemitoneMap[note];
    const semitoneOffsetFromA4 = (octave - 4) * 12 + (semitoneOffsetFromC - 9); // A4 is the reference

    // Calculate frequency
    const frequency = 440 * Math.pow(2, semitoneOffsetFromA4 / 12);

    return frequency;
}
function playNote(note) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    const frequency = noteToFrequency(note);
    if (!frequency) {
        console.error("Invalid note:", note);
        return;
    }

    oscillator.type = 'sine'; // You can change to 'square', 'sawtooth', 'triangle'
    oscillator.frequency.value = frequency;

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 1); // Fade out
    oscillator.stop(audioCtx.currentTime + 1);
}
