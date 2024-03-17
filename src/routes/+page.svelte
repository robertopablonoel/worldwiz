<script>
import {
    tweened
} from 'svelte/motion';
import {
    cubicOut
} from 'svelte/easing';
import {
    onMount
} from 'svelte';
import {
    questions
} from '../stores.js';

import confetti from 'canvas-confetti';

const progress = tweened(0, {
    duration: 400,
    easing: cubicOut
});

let selectedQuestion = null;
let selectedPercent = 0;
let closestPercent = null;
let disableBelow = null;
let disableAbove = null;
let guessCount = 0;
let gameWon = false;

onMount(() => {
    questions.subscribe(data => {
        if (data.length > 0) {
            selectedQuestion = data[Math.floor(Math.random() * data.length)];
        }
    });
});

function setProgress(percent) {
    progress.set(percent);
    selectedPercent = percent;
}

function handleSubmit() {
    guessCount += 1;
    const answer = parseFloat(selectedQuestion.answer);
    const options = Array.from({ length: 21 }, (_, i) => i * 0.05);

    closestPercent = options.reduce((prev, curr) => 
        Math.abs(curr - answer) < Math.abs(prev - answer) ? curr : prev
    );

    if (closestPercent === selectedPercent) {
        launchConfetti();
        gameWon = true;
    } else {
        if (answer > selectedPercent) {
            disableBelow = selectedPercent;
        } else {
            disableAbove = selectedPercent;
        }
    }
}

function launchConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: {
            y: 0.6
        }
    });
}

function shareScore() {
    const message = `I guessed the correct answer in ${guessCount} attempts on this quiz! Can you beat my score?`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

</script>

{#if gameWon}
<div class="congrats-screen">
    <div class="congrats-content">
        <h1>Congratulations!</h1>
        <p>You guessed the correct answer in {guessCount} attempts.</p>
        <button on:click={shareScore}>Share with a friend</button>
    </div>
</div>
{:else}
<div class="container">
    {#if selectedQuestion}
    <div class="question-container">
        <h1>{selectedQuestion.question}</h1>
    </div>
    {/if}
    <progress value={$progress} max="1"></progress>
    <div class="buttons-container">
        {#each Array.from({ length: 21 }, (_, i) => i * 0.05) as percent (percent)}
        <button
            class:selected={percent === selectedPercent}
            class:disabled={disableBelow !== null && percent <= disableBelow || disableAbove !== null && percent >= disableAbove}
            on:click={() => setProgress(percent)}
            disabled={disableBelow !== null && percent <= disableBelow || disableAbove !== null && percent >= disableAbove}
            >
            {Math.round(percent * 100)}%
        </button>
        {/each}
    </div>

    <button class="submit-button" on:click={handleSubmit}>Submit</button>
    <div class="guess-count">Guesses: {guessCount}</div>
</div>
{/if}
        
<style>
:global(body, html) {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    background-color: #121212;
    color: #fff;
    font-family: "Roboto", sans-serif;
    font-weight: 400;
    font-style: normal;
}

.container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    width: 100%;
}

progress {
    display: block;
    width: 80%;
    height: 20px;
    background-color: #333;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 20px;
}

progress::-webkit-progress-bar {
    background-color: #333;
}

progress::-webkit-progress-value {
    background-color: #e5e832;
    border-radius: 10px;
}

progress::-moz-progress-bar {
    background-color: #1db954;
    border-radius: 10px;
}

.buttons-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
    gap: 10px;
    width: 80%;
    padding: 0;
    margin: 20px;
}

button {
    padding: 10px 0;
    border: 1px solid #555;
    background-color: #222;
    color: #fff;
    border-radius: 5px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s;
}

button.selected {
    background-color: #555;
    color: #ddd;
    border-color: #e5e832;
}

button:hover {
    background-color: #333;
}

button.disabled,
button:disabled {
    background-color: #757575;
    color: #9e9e9e;
    border-color: #616161;
    cursor: not-allowed;
}

button:hover:not(:disabled) {
    background-color: #333;
}

@media (max-width: 600px) {
    .buttons-container {
        grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
    }
}

.question-container {
    text-align: center;
    width: 80%;
    margin-bottom: 50px;
}

.question-container h1 {
    font-size: 28px;
    color: #ECEFF1;
    margin: 0;
    padding: 0;
}

.submit-button {
    padding: 10px 30px;
    font-size: 20px;
    font-weight: 700;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    outline: none;
    transition: background-color 0.3s ease;
    margin-top: 20px;
}

.submit-button:hover {
    background-color: #45a049;
}

.guess-count {
    color: #fff;
    margin-top: 10px;
}

.congrats-screen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.85);
    z-index: 10;
}

.congrats-content {
    text-align: center;
    max-width: 400px;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.congrats-screen h1 {
    font-size: 2rem;
    color: #4CAF50;
    margin-bottom: 0.5rem;
}

.congrats-screen p {
    font-size: 1.25rem;
    color: #ECEFF1;
    margin-bottom: 1.5rem;
}

.congrats-screen button {
    padding: 10px 30px;
    font-size: 1rem;
    font-weight: 700;
    color: white;
    background-color: #4CAF50;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    outline: none;
    transition: background-color 0.3s ease;
}

.congrats-screen button:hover {
    background-color: #45a049;
}
</style>