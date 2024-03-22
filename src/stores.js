// stores.js
import { readable } from 'svelte/store';
import { csv } from 'd3-fetch';

export const statements = readable([], set => {
    csv('/fcms_stats.csv').then(data => {
        // Assuming the CSV has columns named 'statement', 'answer', and 'source'
        const formattedData = data.map(d => ({
            statement: d.statement,
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
