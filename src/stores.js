// stores.js
import { readable } from 'svelte/store';
import { csv } from 'd3-fetch';

export const questions = readable([], set => {
    csv('/surprising_statistics_questions_and_answers.csv').then(data => {
        // Assuming the CSV has columns named 'question', 'answer', and 'source'
        const formattedData = data.map(d => ({
            question: d.question,
            answer: d.answer,
            source: d.source
        }));
        set(formattedData);
        console.log('Data loaded:', formattedData);
    }).catch(error => {
        console.error('Error loading CSV:', error);
        set([]);
    });
});
