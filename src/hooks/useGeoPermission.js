import { useState, useEffect } from 'react';

export function useGeoPermission() {
    const [status, setStatus] = useState('prompt'); // 'prompt', 'granted', 'denied'
    const [coords, setCoords] = useState(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setStatus('denied');
            return;
        }

        const checkPermission = async () => {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                setStatus(result.state);
                result.onchange = () => setStatus(result.state);
            } catch (e) {
                console.error('Error checking permission:', e);
            }
        };

        checkPermission();
    }, []);

    const requestPermission = () => {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCoords({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setStatus('granted');
                    resolve(position.coords);
                },
                (error) => {
                    setStatus('denied');
                    reject(error);
                }
            );
        });
    };

    return { status, coords, requestPermission };
}
