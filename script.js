const keys = document.querySelectorAll('.piano-keys');
const keyboard = [
    {color:"white", note:"C", octave:1},
    {color:"black", note:"C#", octave:1, altname: "Db"},
    {color:"white", note:"C", octave:1},
    {color:"black", note:"C#", octave:1, altname:"Db"},
    {color:"white", note:"D", octave:1},
    {color:"black", note:"D#", octave:1, altname:"Eb"},
    {color:"white", note:"E", octave:1},
    {color:"white", note:"F", octave:1},
    {color:"black", note:"F#", octave:1, altname:"Gb"},
    {color:"white", note:"G", octave:1},
    {color:"black", note:"G#", octave:1, altname:"Ab"},
    {color:"white", note:"A", octave:1},
    {color:"black", note:"A#", octave:1, altname:"Bb"},
    {color:"white", note:"B", octave:1},
    {color:"white", note:"C", octave:1},
    {color:"black", note:"C#", octave:1, altname:"Db"},
    {color:"white", note:"D", octave:1},
    {color:"black", note:"D#", octave:1, altname:"Eb"},
    {color:"white", note:"E", octave:1},
    {color:"white", note:"F", octave:1},
    {color:"black", note:"F#", octave:1, altname:"Gb"},
    {color:"white", note:"G", octave:1},
    {color:"black", note:"G#", octave:1, altname:"Ab"},
    {color:"white", note:"A", octave:1},
    {color:"black", note:"A#", octave:1, altname:"Bb"},
    {color:"white", note:"B", octave:1},
    {color:"white", note:"C", octave:1},
    {color:"black", note:"C#", octave:1, altname:"Db"},
    {color:"white", note:"D", octave:1},
    {color:"black", note:"D#", octave:1, altname:"Eb"},
    {color:"white", note:"E", octave:1}
    ]
;
const answer = document.getElementById('answer');
const controls = {
    showNoteName: document.getElementById('showNoteName'),
    useBassClef: document.getElementById('useBassClef'),
    allowSharps: document.getElementById('allowSharps'),
    allowFlats: document.getElementById('allowFlats')
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

        if (clickedNote === game.targetNote || altName === game.targetNote) {
            flashKey(e.target, 'green');
            console.log('✅ Correct! It was', clickedNote);
            // Pick a new note
            setTargetNote();
            answer.innerText = 'Find' + (controls.showNoteName.checked ? `: ${game.targetNote}` : ' the note');

            //update the stave
            drawStave();

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
renderer.resize(500, 200);
const context = renderer.getContext();

function createNote(note) {
    console.log('Creating note:', note);
    let octave = (controls.useBassClef.checked ? "2" : "4"),
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
    const stave = new Stave(10, 40, 400);
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
