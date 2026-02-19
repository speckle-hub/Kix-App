import React, { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Supercluster from 'supercluster';
import { createRoot } from 'react-dom/client';
import { useAuth } from '../../contexts/AuthContext';
import { useGeoPermission } from '../../hooks/useGeoPermission';
import { useNearbyPitches } from '../../hooks/useNearbyPitches';
import { usePlayerPresence } from '../../hooks/usePlayerPresence';
import { PitchMarker } from './PitchMarker';
import { ClusterMarker } from './ClusterMarker';
import { PlayerPulse } from './PlayerPulse';
import { PitchCard } from './PitchCard';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigation2, LocateFixed as GpsFixed, Search, Layers, ShieldCheck } from 'lucide-react';

// Style URL - Carto Dark Matter
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function MapView() {
    const { currentUser } = useAuth();
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markers = useRef({}); // Store markers to clean up
    const playerMarkers = useRef({});

    const [viewport, setViewport] = useState({
        lat: 51.5074,
        lng: -0.1278,
        zoom: 12
    });

    const { status: geoStatus, coords: userCoords, requestPermission } = useGeoPermission();
    const [isSharing, setIsSharing] = useState(false);
    const [selectedPitch, setSelectedPitch] = useState(null);
    const [radius, setRadius] = useState(5000);

    const { pitches, loading: pitchesLoading } = useNearbyPitches(userCoords || viewport, radius);
    const { nearbyPlayers } = usePlayerPresence(currentUser, isSharing, userCoords);

    // Initialize Map
    useEffect(() => {
        if (map.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: MAP_STYLE,
            center: [viewport.lng, viewport.lat],
            zoom: viewport.zoom,
            attributionControl: false
        });

        map.current.on('move', () => {
            const center = map.current.getCenter();
            setViewport(prev => ({
                ...prev,
                lat: center.lat,
                lng: center.lng,
                zoom: map.current.getZoom()
            }));
        });

        return () => map.current?.remove();
    }, []);

    // Center on user once granted
    useEffect(() => {
        if (userCoords && map.current) {
            map.current.flyTo({
                center: [userCoords.lng, userCoords.lat],
                zoom: 14
            });
            setIsSharing(true); // Default to sharing if permission granted for now
        }
    }, [userCoords]);

    // Clustering Logic
    const supercluster = useMemo(() => {
        const sc = new Supercluster({
            radius: 60,
            maxZoom: 16
        });

        const points = pitches.map(p => ({
            type: 'Feature',
            properties: { cluster: false, pitchId: p.id, pitch: p },
            geometry: {
                type: 'Point',
                coordinates: [p.location.lng, p.location.lat]
            }
        }));

        sc.load(points);
        return sc;
    }, [pitches]);

    // Update Markers
    useEffect(() => {
        if (!map.current || !supercluster) return;

        const bounds = map.current.getBounds();
        const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
        const zoom = Math.floor(map.current.getZoom());

        const clusters = supercluster.getClusters(bbox, zoom);

        // Track new set of IDs
        const newMarkerIds = new Set();

        clusters.forEach(feature => {
            const [lng, lat] = feature.geometry.coordinates;
            const { cluster, point_count: count, pitchId } = feature.properties;
            const id = cluster ? `cluster-${feature.id}` : `pitch-${pitchId}`;
            newMarkerIds.add(id);

            if (!markers.current[id]) {
                const el = document.createElement('div');
                const root = createRoot(el);

                if (cluster) {
                    root.render(
                        <ClusterMarker
                            count={count}
                            onClick={() => {
                                const expansionZoom = Math.min(
                                    supercluster.getClusterExpansionZoom(feature.id),
                                    18
                                );
                                map.current.flyTo({ center: [lng, lat], zoom: expansionZoom });
                            }}
                        />
                    );
                } else {
                    root.render(
                        <PitchMarker
                            name={feature.properties.pitch.name}
                            onClick={() => setSelectedPitch(feature.properties.pitch)}
                        />
                    );
                }

                markers.current[id] = new maplibregl.Marker({ element: el })
                    .setLngLat([lng, lat])
                    .addTo(map.current);
            }
        });

        // Clean up old markers
        Object.keys(markers.current).forEach(id => {
            if (!newMarkerIds.has(id)) {
                markers.current[id].remove();
                delete markers.current[id];
            }
        });

    }, [pitches, viewport.lat, viewport.lng, viewport.zoom, supercluster]);

    // Player Presence Markers
    useEffect(() => {
        if (!map.current) return;

        const currentIds = new Set(nearbyPlayers.map(p => p.uid));

        nearbyPlayers.forEach(player => {
            if (!playerMarkers.current[player.uid]) {
                const el = document.createElement('div');
                const root = createRoot(el);
                root.render(<PlayerPulse />);

                playerMarkers.current[player.uid] = new maplibregl.Marker({ element: el })
                    .setLngLat([player.location.lng, player.location.lat])
                    .addTo(map.current);
            } else {
                // Update position
                playerMarkers.current[player.uid].setLngLat([player.location.lng, player.location.lat]);
            }
        });

        // Cleanup stale players
        Object.keys(playerMarkers.current).forEach(uid => {
            if (!currentIds.has(uid)) {
                playerMarkers.current[uid].remove();
                delete playerMarkers.current[uid];
            }
        });

    }, [nearbyPlayers]);

    return (
        <div className="relative w-full h-screen bg-background overflow-hidden">
            <div ref={mapContainer} className="absolute inset-0" />

            {/* Top Controls */}
            <div className="absolute top-6 inset-x-4 flex justify-between items-start pointer-events-none">
                <div className="flex flex-col gap-3 pointer-events-auto">
                    <button
                        onClick={() => {/* Back logic */ }}
                        className="p-3 bg-secondary/80 backdrop-blur-md border border-white/10 rounded-2xl text-white/60 hover:text-white transition-colors"
                    >
                        <Search size={22} />
                    </button>
                    <button
                        onClick={() => setIsSharing(!isSharing)}
                        className={`p-3 backdrop-blur-md border border-white/10 rounded-2xl transition-all ${isSharing ? 'bg-primary text-background' : 'bg-secondary/40 text-white/40'}`}
                        title={isSharing ? "Sharing location" : "Location hidden"}
                    >
                        <ShieldCheck size={22} />
                    </button>
                </div>

                <div className="flex flex-col gap-3 pointer-events-auto">
                    <button
                        onClick={() => map.current?.flyTo({ center: [userCoords?.lng || -0.1278, userCoords?.lat || 51.5074], zoom: 15 })}
                        className="p-3 bg-secondary/80 backdrop-blur-md border border-white/10 rounded-2xl text-white/60 hover:text-white transition-colors"
                    >
                        <Navigation2 size={22} className={geoStatus === 'granted' ? 'text-primary' : ''} />
                    </button>
                    <button
                        onClick={requestPermission}
                        className="p-3 bg-secondary/80 backdrop-blur-md border border-white/10 rounded-2xl text-white/60 hover:text-white transition-colors"
                    >
                        <GpsFixed size={22} />
                    </button>
                </div>
            </div>

            {/* Radius Control */}
            <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col gap-3 items-center pointer-events-auto">
                <div className="p-3 bg-secondary/80 backdrop-blur-md border border-white/10 rounded-full flex flex-col items-center gap-4">
                    <button onClick={() => setRadius(r => Math.min(r + 1000, 10000))} className="text-white/40 hover:text-white">+</button>
                    <div className="h-24 w-1 bg-white/10 rounded-full relative">
                        <motion.div
                            className="absolute bottom-0 w-full bg-primary rounded-full"
                            style={{ height: `${(radius / 10000) * 100}%` }}
                        />
                    </div>
                    <button onClick={() => setRadius(r => Math.max(r - 1000, 1000))} className="text-white/40 hover:text-white">-</button>
                </div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest vertical-text">Range</span>
            </div>

            {/* Bottom Info */}
            <AnimatePresence>
                {selectedPitch && (
                    <PitchCard
                        pitch={selectedPitch}
                        onClose={() => setSelectedPitch(null)}
                        onNavigate={(p) => window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.location.lat},${p.location.lng}`)}
                    />
                )}
            </AnimatePresence>

            {geoStatus === 'prompt' && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-10 inset-x-6 z-[70] p-6 bg-secondary/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl text-center space-y-4"
                >
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                        <Navigation2 size={32} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-condensed">Enable Location</h3>
                        <p className="text-sm text-white/40 italic">"Find the closest pitches and see who's playing in real-time."</p>
                    </div>
                    <Button onClick={requestPermission} className="w-full">ALLOW LOCATION</Button>
                </motion.div>
            )}
        </div>
    );
}
