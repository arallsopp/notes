const keys = document.querySelectorAll('.piano-keys');

keys.forEach((key) => {
    key.addEventListener('click', (e) => {
        let answer = document.getElementById("answer");
        answer.innerText = e.target.dataset.key;
    })
})