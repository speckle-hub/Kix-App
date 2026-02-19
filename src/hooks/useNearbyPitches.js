import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { geohashQueryBounds, distanceBetween } from 'geofire-common';

export function useNearbyPitches(center, radiusInM = 5000) {
    const [pitches, setPitches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!center) return;

        const bounds = geohashQueryBounds([center.lat, center.lng], radiusInM);
        const promises = [];

        for (const b of bounds) {
            const q = query(
                collection(db, 'pitches'),
                where('geohash', '>=', b[0]),
                where('geohash', '<=', b[1])
            );
            promises.push(getDocs(q));
        }

        Promise.all(promises).then((snapshots) => {
            const matchingDocs = [];
            for (const snap of snapshots) {
                for (const d of snap.docs) {
                    const data = d.data();
                    const location = data.location;
                    const distanceInKm = distanceBetween([location.lat, location.lng], [center.lat, center.lng]);
                    const distanceInM = distanceInKm * 1000;

                    if (distanceInM <= radiusInM) {
                        matchingDocs.push({ id: d.id, ...data, distance: distanceInM });
                    }
                }
            }
            setPitches(matchingDocs);
            setLoading(false);
        }).catch(err => {
            console.error('Error fetching nearby pitches:', err);
            setLoading(false);
        });

    }, [center?.lat, center?.lng, radiusInM]);

    return { pitches, loading };
}
