const keys = document.querySelectorAll('.piano-keys');

keys.forEach((key) => {
    key.addEventListener('click', (e) => {
        let clickedKey = e.target.dataset.key,
            answer = document.getElementById("answer");
        answer.innerText = clickedKey;
    })
})