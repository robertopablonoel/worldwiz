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

let selectedStatements = [];
let guessCount = 0;
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
            }));
            correctOrder = [...selectedStatements].sort((a, b) => a.answer - b.answer);
        }
    });
});

function handleSubmit() {
    guessCount += 1;
    const updatedStatements = selectedStatements.map((statement, index) => {
        const isCorrect = correctOrder[index].id === statement.id;
        return {
            ...statement,
            correct: isCorrect,
        };
    });

    selectedStatements = [...updatedStatements];
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




</script>

<div class="container">
    <div class="statement-section" use:dndzone={{ items: selectedStatements, flipDurationMs: 300 }} on:consider={handleDrop} on:finalize={handleDrop}>
        {#each selectedStatements as statement (statement.id)}
        <div class="statement-container {statement.correct ? 'correct' : ''}">
            <p>{statement.statement}</p>
            {#if statement.correct}
            <div class="correct-badge">Correct - {statement.answer*100}%</div>
            {/if}
        </div>
        {/each}
    </div>
    <button class="submit-button" on:click={handleSubmit}>Submit Rankings</button>
    <div class="guess-count">Attempts: {guessCount}</div>
</div>

<style>
:global(body, html) {
    height: 100%;
    margin: 0;
    padding: 0;
    background-color: #121212;
    color: #fff;
    font-family: "Roboto", sans-serif;
}

.container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    width: 100%;
    /* Full width */
}

.statement-section {
    width: 100%;
    /* Adjust width as needed for mobile responsiveness */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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
    height: 37px;
    /* Note: You might need to adjust or remove the fixed height to better fit the content */
    margin: 10px 0;
    padding: 20px;
    background-color: #222;
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    cursor: grab;
    text-align: center;
    /* This ensures text is centered, useful if the text wraps to a new line */
}

.statement-container.correct {
    background-color: #4CAF50;
    /* Green background for correct statements */
}

.correct {
    -webkit-user-drag: none;
    user-select: none;
    pointer-events: none;
  }

.correct-badge {
    position: absolute;
    top: 0;
    right: 0;
    background-color: #333;
    color: white;
    padding: 5px;
    border-radius: 0 0 0 5px;
    font-size: 0.75rem;
}

.statement-container p {
    margin: 0;
    /* Keeps the paragraph snug */
    font-size: 20px;
    /* Ensure you add 'px' to define the unit */
}

.statement-container:active {
    cursor: grabbing;
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
</style>
