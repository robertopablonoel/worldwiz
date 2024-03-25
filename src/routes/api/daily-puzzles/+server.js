import clientPromise from '$lib/db';
import { json } from '@sveltejs/kit';

console.log('API endpoint /api/daily-puzzles loaded');

const START_DATE = new Date('2024-03-24');
const DB_NAME = 'puzzles';
const DAILY_PUZZLES = 'daily-puzzles';
const COUNTERS = 'counters';

function calculateDayIndex(date, startDate) {
	const currentDate = new Date(date).setHours(0, 0, 0, 0);
	const oneDay = 24 * 60 * 60 * 1000;
	return Math.floor((currentDate - startDate) / oneDay);
}

export async function GET() {
	const today = new Date();
	const todayIndex = calculateDayIndex(today, START_DATE);

	const client = await clientPromise;
	const db = client.db(DB_NAME);
	const collection = db.collection(DAILY_PUZZLES);

	try {
		const puzzle = await collection.findOne({ date: todayIndex });
		if (puzzle) {
			return {
				status: 200,
				body: { puzzle }
			};
		} else {
			return {
				status: 404,
				body: { error: 'Puzzle not found' }
			};
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

	console.log(data);
	
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
			typeof entry.question === 'string' &&
			entry.question.length > 0
		);
	});

	if (!isValidEntries) {
		return {
			status: 400,
			body: {
				error: 'Each entry must have a numeric answer and non-empty source and question strings.'
			}
		};
	}

	try {
		let dayIndex;

		if (data.date) {
			dayIndex = calculateDayIndex(data.date);
		} else {
			const counter = await countersCollection.findOneAndUpdate(
				{ _id: 'dayCounter' },
				{ $inc: { day: 1 } },
				{ upsert: true, returnDocument: 'after' }
			);
			console.log('counter:', counter)
			dayIndex = counter.day;
		}

		const response = await collection.updateOne(
			{ day: dayIndex },
			{ $set: { entries: data.entries } },
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
