const playerButton = document.querySelectorAll('.player-button'),
    audios = document.querySelectorAll('audio'),
    playIcon = "<i class='fas fa-play-circle'></i>",
    pauseIcon =  "<i class='fas fa-pause-circle'></i>"

Array.from(playerButton).forEach((el) => {
    el.addEventListener('click', toggleAudio)
})
Array.from(audios).forEach((el) => {
    el.onended = audioEnded;
})

function toggleAudio () {
    const audio = this.parentNode.parentNode.querySelector('audio');
    if (audio.paused){
        audio.play();
        this.innerHTML = pauseIcon;
    } else {
        audio.pause();
        this.innerHTML = playIcon;
    }
}

function audioEnded () {
    this.nextElementSibling.lastElementChild.innerHTML = playIcon;
}

