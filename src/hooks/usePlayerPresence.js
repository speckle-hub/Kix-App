import { useState, useEffect } from 'react';
import { doc, setDoc, deleteDoc, serverTimestamp, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';

export function usePlayerPresence(currentUser, isSharing, userCoords) {
    const [nearbyPlayers, setNearbyPlayers] = useState([]);

    // Update our own presence
    useEffect(() => {
        if (!currentUser || !isSharing || !userCoords) {
            if (currentUser) {
                deleteDoc(doc(db, 'presence', currentUser.uid)).catch(() => { });
            }
            return;
        }

        const hash = geohashForLocation([userCoords.lat, userCoords.lng]);
        const presenceRef = doc(db, 'presence', currentUser.uid);

        setDoc(presenceRef, {
            uid: currentUser.uid,
            displayName: currentUser.displayName || 'Player',
            location: userCoords,
            geohash: hash,
            updatedAt: serverTimestamp()
        }, { merge: true });

        // Cleanup on unmount or when sharing is toggled
        return () => {
            deleteDoc(presenceRef).catch(() => { });
        };
    }, [currentUser?.uid, isSharing, userCoords?.lat, userCoords?.lng]);

    // Listen for nearby players
    useEffect(() => {
        if (!currentUser || !isSharing || !userCoords) {
            setNearbyPlayers([]);
            return;
        }

        const bounds = geohashQueryBounds([userCoords.lat, userCoords.lng], 2000); // 2km radius
        const allUnsubs = [];
        const snapshotsData = new Map();

        bounds.forEach((b, index) => {
            const q = query(
                collection(db, 'presence'),
                where('geohash', '>=', b[0]),
                where('geohash', '<=', b[1])
            );

            const unsub = onSnapshot(q, (snap) => {
                const now = Date.now();
                const staleThreshold = 120000; // 2 minutes

                const playersInBound = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(p => {
                        if (p.id === currentUser.uid) return false;
                        const dist = distanceBetween([p.location.lat, p.location.lng], [userCoords.lat, userCoords.lng]) * 1000;
                        const updatedAt = p.updatedAt?.toMillis ? p.updatedAt.toMillis() : now;
                        return dist <= 2000 && (now - updatedAt) < staleThreshold;
                    });

                snapshotsData.set(index, playersInBound);

                // Combine all snapshots
                const combined = [];
                const seen = new Set();
                snapshotsData.forEach(list => {
                    list.forEach(p => {
                        if (!seen.has(p.id)) {
                            combined.push(p);
                            seen.add(p.id);
                        }
                    });
                });
                setNearbyPlayers(combined);
            });
            allUnsubs.push(unsub);
        });

        return () => allUnsubs.forEach(u => u());
    }, [currentUser?.uid, isSharing, userCoords?.lat, userCoords?.lng]);

    return { nearbyPlayers };
}
