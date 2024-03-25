// stores.js
import { readable } from 'svelte/store';
import { csv } from 'd3-fetch';

export const entries = readable([], set => {
    csv('/surprising_statistics_entries_and_answers.csv').then(data => {
        const formattedData = data.map(d => ({
            statement: d.statement,
            answer: d.answer,
            source: d.source
        }));
        set(formattedData);
    }).catch(error => {
        console.error('Error loading CSV:', error);
        set([]);
    });
});

export const dailyPuzzle = readable([], set => {
    fetch('/api/daily-puzzles').then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }).then(data => {
        set(data.body);
    }).catch(error => {
        console.error('Error loading daily puzzles:', error);
        set([]);
    });
});
