const keys = document.querySelectorAll('.piano-keys');
const answer = document.getElementById('answer');

// Collect all available note names from the keys
const availableNotes = Array.from(keys).map(k => k.dataset.key);

// Pick a random target note
let targetNote = getRandomNote();
answer.innerText = 'Find: ' + targetNote;
console.log('Target note:', targetNote);

function getRandomNote() {
    const randomIndex = Math.floor(Math.random() * availableNotes.length);
    return availableNotes[randomIndex];
}

// Add listeners
keys.forEach((key) => {
    key.addEventListener('click', (e) => {
        const clickedNote = e.target.dataset.key;

        if (clickedNote === targetNote) {
            flashKey(e.target, 'green');
            console.log('✅ Correct! It was', clickedNote);
            // Pick a new note
            targetNote = getRandomNote();
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
    }, 400);
}