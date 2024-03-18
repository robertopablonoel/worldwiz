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

let selectedStatements = [];
let guessCount = 0;
let gameWon = false;
let correctOrder = [];

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

        // Initialize the feedback array if it doesn't exist
        if (!statement.feedback) {
            statement.feedback = [];
        }

        // Push new feedback into the feedback array, now as an object indicating correctness
        statement.feedback.push({
            isCorrect
        });

        return {
            ...statement,
            correct: isCorrect,
        };
    });

    selectedStatements = [...updatedStatements];

    if (selectedStatements.every(statement => statement.correct)) {
        gameWon = true;
        launchConfetti();
    }
}

function handleDrop(event) {
    const newOrder = event.detail.items;
    let result = [];

    // Initialize the result array with placeholders for the 'correct' items
    selectedStatements.forEach((item, index) => {
        result[index] = item.correct ? item : undefined;
    });

    // Process the new order, skipping 'correct' items
    newOrder.forEach((item, newIndex) => {
        if (!item.correct) {
            // Find the next available spot that is not a 'correct' item
            let currentIndex = result.findIndex((el, idx) => el === undefined && !selectedStatements[idx].correct);
            if (currentIndex !== -1) {
                result[currentIndex] = item;
            }
        }
    });

    // Remove any undefined placeholders left in the result
    result = result.filter(item => item !== undefined);

    selectedStatements = result;
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

</script>

<div class="container">
    {#if gameWon}
    <div class="congrats-screen">
        <div class="congrats-content">
            <h1>Congratulations!</h1>
            <p>You guessed the correct answer in {guessCount} attempts.</p>
        </div>
    </div>
    {:else if guessCount < 5}
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
    <div class="guess-count">Attempts: {guessCount}</div>
    {:else}
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
    justify-content: flex-start; /* Align content to the top */
    max-height: 100vh; /* Set max height to viewport height */
    overflow-y: auto; /* Enable scrolling within container */
    width: 100%;
    /* Full width */
}

.title-container {
    width: 80%;
    text-align: center;
}

.statement-section {
    width: 100%;
    /* Adjust width as needed for mobile responsiveness */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.arrow-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px; /* Adjust size as needed */
    color: #FFF; /* Adjust color as needed */
    margin: 5px 0; /* Spacing above and below the arrows */
}

.statement-container {
    position: relative;
    display: flex;
    /* This makes it a flex container */
    align-items: center;
    /* This vertically centers the content */
    justify-content: center;
    /* This horizontally centers the content */
    width: 80%;
    max-width: 600px;
    min-height: 30px;
    /* Note: You might need to adjust or remove the fixed height to better fit the content */
    margin: 15px 0;
    padding: 10px;
    background-color: #222;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    cursor: grab;
    text-align: center;
    /* This ensures text is centered, useful if the text wraps to a new line */
}

@media (min-width: 600px) {
    .statement-container {
        padding: 20px; /* Fixed size for larger screens */
    }
}

.statement-container.correct {
    border: 2px solid #45a049;
    /* Green background for correct statements */
}

.correct {
    -webkit-user-drag: none;
    user-select: none;
    pointer-events: none;
}

.statement-container p {
    margin: 0;
    /* Keeps the paragraph snug */
    font-size: 3vw;
    /* Ensure you add 'px' to define the unit */
}
@media (min-width: 600px) {
    .statement-container p {
        font-size: 18px; /* Fixed size for larger screens */
    }
}
.statement-container:active {
    cursor: grabbing;
}

.percentage-badge {
    position: absolute;
    top: 0px;
    /* Adjust this value as needed */
    right: 15px;
    /* Adjust this value as needed */
    background-color: #ffffff;
    /* White background for the badge */
    color: #000000;
    /* Text color */
    padding: 5px 10px;
    /* Padding inside the badge */
    border-radius: 10px;
    /* Rounded corners for the badge */
    font-weight: bold;
    /* Optional: makes the percentage text bold */
    z-index: 2;
    /* Ensure it's above the feedback badges if they overlap */
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    /* Optional: adds a subtle shadow */
    transform: translateY(-50%) translateX(50%);
    /* Adjusts the badge to partially stick out */
    white-space: nowrap;
    /* Prevents the text from wrapping */
}

.badge-container {
    position: absolute;
    top: 0px;
    left: 0px; /* Adjust this as needed */
    display: flex;
    align-items: center;
    justify-content: start;
    padding: 5px; /* Adjust padding for better spacing */
    background: #505050; /* Starting color for gradient */
    background: linear-gradient(to right, #505050, #3c3c3c); /* Subtle gradient for depth */
    border-radius: 10px; /* More pronounced rounded corners */
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2); /* Refined shadow for a softer look */
    transform: translateY(-70%); /* Center vertically relative to the statement's top edge */
    z-index: 10; /* Ensure it sits above other elements */
}

.feedback-badge {
    width: 12px; /* Slightly smaller for a more refined look */
    height: 12px;
    border-radius: 50%; /* Fully rounded to create circle shapes */
    background-color: #a9a9a9; /* Default dark grey for unguessed badges */
    margin: 0 4px; /* Adjust margin for better spacing */
    transition: background-color 0.3s ease; /* Smooth transition for color change */
}

/* When a badge is correct or incorrect, change the background color */
.feedback-badge.correct {
    background-color: #4CAF50; /* Green for correct */
}

.feedback-badge.incorrect {
    background-color: #f44336; /* Red for incorrect */
}

/* Ensure the default badge does not interfere with the correct/incorrect badges */
.default {
    background-color: #a9a9a9; /* Same as initial badge color */
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
    background-color: rgba(0, 0, 0, 0.85);
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

/* Customizing the scrollbar for the draggable area, if needed */
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
