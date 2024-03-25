<script>
	let providedDate;
	let entries = [
		{ answer: 0, source: '', question: '' },
		{ answer: 0, source: '', question: '' },
		{ answer: 0, source: '', question: '' },
		{ answer: 0, source: '', question: '' },
		{ answer: 0, source: '', question: '' }
	];

	async function submitForm() {
		if (
			entries.some((entry) => entry.answer <= 0 || !entry.source.trim() || !entry.question.trim())
		) {
			console.error('Each entry must have a positive answer and non-empty source and question.');
			return;
		}

		const data = providedDate ? { date: providedDate, entries } : { entries };

		const response = await fetch('/api/daily-puzzles', {
			method: 'POST',
			body: JSON.stringify({ data }),
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
		{#each entries as entry, index (index)}
			<fieldset>
				<legend>Entry {index + 1}</legend>
				<label for={`answer-${index}`}>Answer:</label>
				<input
					type="number"
					id={`answer-${index}`}
					bind:value={entry.answer}
					min="0.01"
					step="0.01"
					required
				/>

				<label for={`source-${index}`}>Source:</label>
				<input type="text" id={`source-${index}`} bind:value={entry.source} required />

				<label for={`question-${index}`}>Question:</label>
				<input type="text" id={`question-${index}`} bind:value={entry.question} required />
			</fieldset>
		{/each}

		<button type="submit">Add Puzzle</button>
	</form>
</div>
