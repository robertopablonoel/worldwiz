<script>
let providedDate;
let isPercentageDisplay = 'no'; // Display value, initially 'no'
$: isPercentage = isPercentageDisplay === 'yes'; // Converts to true/false
let entries = [{
        answer: 0,
        source: '',
        fact: ''
    },
    {
        answer: 0,
        source: '',
        fact: ''
    },
    {
        answer: 0,
        source: '',
        fact: ''
    },
    {
        answer: 0,
        source: '',
        fact: ''
    },
    {
        answer: 0,
        source: '',
        fact: ''
    }
];

async function submitForm() {
    if (
        entries.some((entry) => entry.answer <= 0 || !entry.source.trim() || !entry.fact.trim())
    ) {
        console.error('Each entry must have a positive answer and non-empty source and fact.');
        return;
    }

    const data = providedDate ? {
        date: providedDate,
        isPercentage,
        entries
    } : {
        isPercentage,
        entries
    };

    const response = await fetch('/api/daily-puzzles', {
        method: 'POST',
        body: JSON.stringify({
            data
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        console.log('Puzzle added successfully!');
    } else {
        console.error('Failed to add puzzle');
    }
}
</script>

<div>
    <h1>Add Puzzle</h1>
    <form on:submit|preventDefault={submitForm}>
        <label for="date">Date (optional):</label>
        <input type="date" id="date" bind:value={providedDate} placeholder="YYYY-MM-DD" />
        <br>
        <label for="isPercentage">Is the answer a percentage?</label>
        <label for="isPercentageYes">
            <input type="radio" id="isPercentageYes" name="isPercentage" bind:group={isPercentageDisplay} value="yes">
            Yes
        </label>
        <label for="isPercentageNo">
            <input type="radio" id="isPercentageNo" name="isPercentage" bind:group={isPercentageDisplay} value="no">
            No
        </label>
        {#each entries as entry, index (index)}
        <fieldset>
            <legend>Entry {index + 1}</legend>
            <label for={`answer-${index}`}>Answer:</label>
            <input
                type="number"
                id={`answer-${index}`}
                bind:value={entry.answer}
                required
                />

            <label for={`source-${index}`}>Source:</label>
            <input type="text" id={`source-${index}`} bind:value={entry.source} required />

            <label for={`fact-${index}`}>fact:</label>
            <input type="text" id={`fact-${index}`} bind:value={entry.fact} required />
        </fieldset>
        {/each}

        <button type="submit">Add Puzzle</button>
    </form>
</div>
