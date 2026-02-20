import { db } from './firebase';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { geohashForLocation } from 'geofire-common';

const SAMPLE_PITCHES = [
    { name: 'Hackney Marshes', lat: 51.5494, lng: -0.0248, type: 'Grass / 11-a-side' },
    { name: 'Powerleague Shoreditch', lat: 51.5244, lng: -0.0784, type: '3G / 5-a-side' },
    { name: 'Victoria Park Pitch', lat: 51.5367, lng: -0.0396, type: 'Grass / 7-a-side' },
    { name: 'London Fields Astro', lat: 51.5404, lng: -0.0592, type: '3G / 5-a-side' },
    { name: 'Mile End Stadium', lat: 51.5222, lng: -0.0278, type: 'Astro / 11-a-side' },
    { name: 'Highbury Fields', lat: 51.5463, lng: -0.1037, type: 'Astro / 7-a-side' },
    { name: 'Haggerston Park', lat: 51.5336, lng: -0.0658, type: '3G / 5-a-side' },
    { name: 'Market Road Football Centre', lat: 51.5478, lng: -0.1264, type: '3G / 11-a-side' },
];

export async function seedPitches() {
    try {
        const pitchesCol = collection(db, 'pitches');
        const snap = await getDocs(query(pitchesCol, limit(1)));

        if (!snap.empty) {
            console.log("⚽ KIX SEED: Pitches already exist, skipping.");
            return;
        }

        console.log("⚽ KIX SEED: Seeding sample pitches...");
        const promises = SAMPLE_PITCHES.map(pitch => {
            const hash = geohashForLocation([pitch.lat, pitch.lng]);
            return addDoc(pitchesCol, {
                ...pitch,
                location: { lat: pitch.lat, lng: pitch.lng },
                geohash: hash,
                createdAt: new Date().toISOString()
            });
        });

        await Promise.all(promises);
        console.log("✅ KIX SEED: Sample pitches seeded successfully!");
    } catch (error) {
        console.error("❌ KIX SEED ERROR:", error);
    }
}
