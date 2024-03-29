import clientPromise from '$lib/db';
import { json } from '@sveltejs/kit';

console.log('API endpoint /api/daily-puzzles loaded');

const START_DATE = new Date('2024-03-22T00:00:00-05:00');
const DB_NAME = 'puzzles';
const DAILY_PUZZLES = 'daily-puzzles';
const COUNTERS = 'counters';

function calculateDayIndex(date, startDate) {
	const currentDate = new Date(date).setHours(0, 0, 0, 0);
	const oneDay = 24 * 60 * 60 * 1000;
	return Math.floor((currentDate - startDate) / oneDay);
}

export async function GET() {

	const utcToday = new Date();
	const estOffset = 5 * 60 * 60 * 1000; // EST is UTC-5 hours, in milliseconds
	const today = new Date(utcToday - estOffset);

	const todayIndex = calculateDayIndex(today, START_DATE);
	console.log(`todayIndex: ${todayIndex} for date: ${today}`);

	const client = await clientPromise;
	const db = client.db(DB_NAME);
	const collection = db.collection(DAILY_PUZZLES);

	try {
		const puzzle = await collection.findOne({ day: todayIndex });
		if (puzzle) {
			return json({
				status: 200,
				body: { entries: puzzle.entries }
			});
		} else {
			return json({
				status: 404,
				body: { error: 'Puzzle not found' }
			});
		}
	} catch (e) {
		return {
			status: 500,
			body: { error: 'An error occurred while fetching the puzzle.' }
		};
	}
}

export async function POST({request}) {
	const { data } = await request.json();
	const client = await clientPromise;
	const db = client.db(DB_NAME);
	const collection = db.collection(DAILY_PUZZLES);
	const countersCollection = db.collection(COUNTERS);
	
	if (!data.entries || data.entries.length !== 5) {
		return {
			status: 400,
			body: { error: 'There must be exactly 5 entries.' }
		};
	}

	const isValidEntries = data.entries.every((entry) => {
		return (
			typeof entry.answer === 'number' &&
			typeof entry.source === 'string' &&
			entry.source.length > 0 &&
			typeof entry.fact === 'string' &&
			entry.fact.length > 0
		);
	});

	if (!isValidEntries) {
		return {
			status: 400,
			body: {
				error: 'Each entry must have a numeric answer and non-empty source and fact strings.'
			}
		};
	}

	try {
		let dayIndex;

		if (data.date) {
			dayIndex = calculateDayIndex(data.date, START_DATE);
		} else {
			const counter = await countersCollection.findOneAndUpdate(
				{ _id: 'dayCounter' },
				{ $inc: { day: 1 } },
				{ upsert: true, returnDocument: 'after' }
			);
			console.log('counter:', counter)
			dayIndex = counter.day;
		}

		console.log(`dayIndex: ${dayIndex} for date: ${data.date}`);

		const response = await collection.updateOne(
			{ day: dayIndex },
			{ $set: { isPercentage: data.isPercentage, entries: data.entries } },
			{ upsert: true }
		);

		console.log('response:', response);

		return json({
			status: 200,
			body: { message: 'Puzzle added or updated successfully', _id: response, day: dayIndex }
		});
	} catch (error) {
		console.error('Error inserting puzzle:', error);
		return json({
			status: 500,
			body: { error: 'An error occurred while adding the puzzle.' }
		});
	}
}
