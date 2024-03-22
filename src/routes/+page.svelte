<script>
import {
    dndzone
} from 'svelte-dnd-action';
import {
    onMount
} from 'svelte';
import {
    statements
} from '../stores.js';
import confetti from 'canvas-confetti';

const BASE_SCORE = 10000;
const DISTANCE_POINTS = 50;
const GUESS_PENALTY = .1;

let selectedStatements = [];
let correctOrder = [];
let guessMatrix = [];

let proximityScore = BASE_SCORE;
let finalScore = 0;
let guessCount = 0;
let gameWon = false;
let guessMatrixString = "";

onMount(() => {
    statements.subscribe(data => {
        if (data.length >= 5) {
            let indices = new Set();
            while (indices.size < 5) {
                indices.add(Math.floor(Math.random() * data.length));
            }
            selectedStatements = [...indices].map(index => ({
                ...data[index],
                id: index,
                correct: false,
                feedback: [],
            }));
            correctOrder = [...selectedStatements].sort((a, b) => b.answer - a.answer);
        }
    });
});

function handleSubmit() {
    guessCount += 1;

    const updatedStatements = selectedStatements.map((statement, index) => {
        const isCorrect = correctOrder[index].id === statement.id;

        if (!statement.feedback) {
            statement.feedback = [];
        }

        statement.feedback.push({
            isCorrect
        });

        return {
            ...statement,
            correct: isCorrect,
        };
    });

    selectedStatements = [...updatedStatements];
    calculateProximityScore();

    if (selectedStatements.every(statement => statement.correct)) {
        gameWon = true;
        calculateScore();
        calculateGuessMatrix();
        launchConfetti();
    }
}

function handleDrop(event) {
    const newOrder = event.detail.items;
    let result = [];

    selectedStatements.forEach((item, index) => {
        result[index] = item.correct ? item : undefined;
    });

    newOrder.forEach((item, newIndex) => {
        if (!item.correct) {
            let currentIndex = result.findIndex((el, idx) => el === undefined && !selectedStatements[idx].correct);
            if (currentIndex !== -1) {
                result[currentIndex] = item;
            }
        }
    });

    result = result.filter(item => item !== undefined);

    selectedStatements = result;
}

function calculateProximityScore() {
    let startingScore = proximityScore;

    proximityScore = selectedStatements.reduce((score, statement, index) => {
        let correctIndex = correctOrder.findIndex(s => s.id === statement.id);
        let distance = Math.abs(correctIndex - index);
        return score - (distance * DISTANCE_POINTS);
    }, startingScore);

    console.log(`Current Proximity Score: ${proximityScore}`);
}

function calculateScore() {
    console.log(`Proximity Score: ${proximityScore}`);
    finalScore = proximityScore * (1 - ((guessCount - 1) * GUESS_PENALTY));
    console.log(`Final Score: ${finalScore}`);
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

async function shareOrCopyResults() {
    const shareText = `ListRank (listrank.co) Score: ${finalScore.toLocaleString()} Guesses: ${guessCount}/5\n\n${guessMatrixString}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'My Game Results',
                text: shareText,
            });
        } catch (err) {
            console.error('Error sharing:', err);
        }
    } else {
        try {
            await navigator.clipboard.writeText(shareText);
            alert('Results copied to clipboard.');
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy results to clipboard.');
        }
    }
}

function calculateGuessMatrix() {
    let feedbackMatrix = selectedStatements.map(s => s.feedback);
    guessMatrix = feedbackMatrix.map(row => {
        let adjustedRow = row.slice();
        while (adjustedRow.length < 5) {
            adjustedRow.push({
                isCorrect: true
            });
        }
        return adjustedRow;
    });
    guessMatrixString = guessMatrix.map(row =>
        row.map(feedback => feedback.isCorrect ? '🟩' : '🟥').join(' ')
    ).join('\n');
}
</script>

<div class="container">
    {#if gameWon}
    <div class="congrats-screen">
        <div class="congrats-content">
            <h1>Congratulations!</h1>
            <p>ListRank Score: {finalScore.toLocaleString()} Guesses: {guessCount}/5</p>
            {#each guessMatrix as row}
            {#each row as feedback}
            {#if feedback.isCorrect}
            <span>🟩</span>
            {:else}
            <span>🟥</span>
            {/if}
            {/each}
            <br>
            {/each}
            <button on:click={shareOrCopyResults}>
                Share Results
            </button>
        </div>
    </div>
    {/if}
    <div class="arrow-indicator high">▲ High</div>
    <div class="statement-section" use:dndzone={{ items: selectedStatements, flipDurationMs: 300 }} on:consider={handleDrop} on:finalize={handleDrop}>
        {#each selectedStatements as statement (statement.id)}
        <div class="statement-container {statement.correct ? 'correct' : ''}">
            <div class="badge-container">
                {#each Array(5) as _, index (index)}
                <div class="feedback-badge {statement.feedback[index] ? (statement.feedback[index].isCorrect ? 'correct' : 'incorrect') : 'default'}"></div>
                {/each}
            </div>
            <p>{statement.statement}</p>
            {#if statement.correct}
            <div class="percentage-badge">{Math.round(statement.answer * 100)}%</div>
            {/if}
        </div>
        {/each}
    </div>
    <div class="arrow-indicator low">▼ Low</div>
    <button class="submit-button" on:click={handleSubmit}>Submit Rankings</button>
    <div class="guess-count">Guesses: {guessCount}</div>
    {#if guessCount >= 5 && !gameWon}
    <div class="congrats-screen" class:show={selectedStatements.every(statement => statement.correct)}>
        <div class="congrats-content">
            <h1>Better luck next time!</h1>
        </div>
    </div>
    {/if}
</div>

<style>
:global(body, html) {
    margin: 0;
    padding: 0;
    background-color: #121212;
    color: #fff;
    font-family: "Roboto", sans-serif;
    height: 100%;
    overflow: hidden;
}

.container {
    display: flex;
    padding-top: 20px;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    max-height: 100vh;
    overflow-y: auto;
    width: 100%;
}

.title-container {
    width: 80%;
    text-align: center;
}

.statement-section {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.arrow-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: #FFF;
    margin: 5px 0;
}

.statement-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80%;
    max-width: 600px;
    min-height: 30px;
    margin: 15px 0;
    padding: 10px;
    background-color: #222;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    cursor: grab;
    text-align: center;
}

@media (min-width: 600px) {
    .statement-container {
        padding: 20px;
    }
}

.statement-container.correct {
    border: 2px solid #45a049;
}

.correct {
    -webkit-user-drag: none;
    user-select: none;
    pointer-events: none;
}

.statement-container p {
    margin: 0;
    font-size: 3vw;
}

@media (min-width: 600px) {
    .statement-container p {
        font-size: 18px;
    }
}

.statement-container:active {
    cursor: grabbing;
}

.percentage-badge {
    position: absolute;
    top: 0px;
    right: 15px;
    background-color: #ffffff;
    color: #000000;
    padding: 5px 10px;
    border-radius: 10px;
    font-weight: bold;
    z-index: 2;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transform: translateY(-50%) translateX(50%);
    white-space: nowrap;
}

.badge-container {
    position: absolute;
    top: 0px;
    left: 0px;
    display: flex;
    align-items: center;
    justify-content: start;
    padding: 5px;
    background: linear-gradient(to right, #505050, #3c3c3c);
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    transform: translateY(-70%);
    z-index: 10;
}

.feedback-badge {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #a9a9a9;
    margin: 0 4px;
    transition: background-color 0.3s ease;
}

.feedback-badge.correct {
    background-color: #4CAF50;
}

.feedback-badge.incorrect {
    background-color: #f44336;
}

.default {
    background-color: #a9a9a9;
}

.submit-button {
    padding: 15px 30px;
    margin: 20px 0;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s;
}

.submit-button:hover {
    background-color: #45a049;
}

.guess-count {
    color: #fff;
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
    background-color: rgba(0, 0, 0, 0.25);
}

.congrats-content {
    text-align: center;
    padding: 20px;
    border-radius: 10px;
}

.submit-button {
    padding: 10px 30px;
    margin-top: 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s;
}

.submit-button:hover {
    background-color: #45a049;
}

.guess-count {
    margin-top: 10px;
    color: #fff;
}

::-webkit-scrollbar {
    width: 10px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;

    border-radius: 10px;
}

::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
    background: #555;
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
    background-color: rgba(0, 0, 0, .8);
    z-index: 50;
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
    background-color: #58a351;
    color: white;
    border-radius: 104px;
    border: none;
    font-weight: 700;
    font: 600 16px/20px;
    line-height: 16px;
    height: 44px;
    width: 198px;
    vertical-align: middle;
    cursor: pointer;
    transition: background-color 0.3s ease;
    margin-top: 10px;
}

.congrats-screen button:hover {
    background-color: #45a049;
}
</style>
