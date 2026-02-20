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
            const { lng, lat } = map.current.getCenter();
            setViewport({
                lng,
                lat,
                zoom: map.current.getZoom()
            });
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    // Clustering Logic
    const clusterer = useMemo(() => {
        const index = new Supercluster({
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

        index.load(points);
        return index;
    }, [pitches]);

    // Update Markers
    useEffect(() => {
        if (!map.current) return;

        const bounds = map.current.getBounds();
        const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
        const zoom = Math.floor(map.current.getZoom());
        const clusters = clusterer.getClusters(bbox, zoom);

        // Remove old markers
        Object.keys(markers.current).forEach(id => {
            if (!clusters.find(c => c.id === id || c.properties?.pitchId === id)) {
                markers.current[id].remove();
                delete markers.current[id];
            }
        });

        // Add / Update markers
        clusters.forEach(feat => {
            const [lng, lat] = feat.geometry.coordinates;
            const isCluster = feat.properties.cluster;
            const id = isCluster ? `cluster-${feat.id}` : feat.properties.pitchId;

            if (markers.current[id]) return;

            const el = document.createElement('div');
            const root = createRoot(el);

            if (isCluster) {
                root.render(
                    <ClusterMarker
                        count={feat.properties.point_count}
                        onClick={() => {
                            const expansionZoom = Math.min(clusterer.getClusterExpansionZoom(feat.id), 18);
                            map.current.flyTo({ center: [lng, lat], zoom: expansionZoom });
                        }}
                    />
                );
            } else {
                root.render(
                    <PitchMarker
                        pitch={feat.properties.pitch}
                        active={selectedPitch?.id === id}
                        onClick={() => setSelectedPitch(feat.properties.pitch)}
                    />
                );
            }

            markers.current[id] = new maplibregl.Marker({ element: el })
                .setLngLat([lng, lat])
                .addTo(map.current);
        });
    }, [clusterer, viewport, selectedPitch]);

    // Update Player Markers
    useEffect(() => {
        if (!map.current) return;

        // Cleanup
        Object.keys(playerMarkers.current).forEach(id => {
            if (!nearbyPlayers.find(p => p.id === id)) {
                playerMarkers.current[id].remove();
                delete playerMarkers.current[id];
            }
        });

        nearbyPlayers.forEach(player => {
            if (playerMarkers.current[player.id]) {
                playerMarkers.current[player.id].setLngLat([player.location.lng, player.location.lat]);
                return;
            }

            const el = document.createElement('div');
            const root = createRoot(el);
            root.render(<PlayerPulse />);

            playerMarkers.current[player.id] = new maplibregl.Marker({ element: el })
                .setLngLat([player.location.lng, player.location.lat])
                .addTo(map.current);
        });
    }, [nearbyPlayers]);

    return (
        <div className="relative w-full h-screen bg-background overflow-hidden font-condensed">
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
                        onClick={() => map.current?.flyTo({ center: [userCoords?.lng || viewport.lng, userCoords?.lat || viewport.lat], zoom: 15 })}
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
                        <div
                            className="absolute bottom-0 w-full bg-primary rounded-full transition-all"
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
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-0 inset-x-0 z-50 p-6 pointer-events-none"
                    >
                        <div className="max-w-md mx-auto pointer-events-auto">
                            <PitchCard
                                pitch={selectedPitch}
                                onClose={() => setSelectedPitch(null)}
                                onNavigate={(p) => window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.location.lat},${p.location.lng}`)}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {(geoStatus === 'prompt' || geoStatus === 'denied') && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute bottom-10 inset-x-6 z-[70] p-6 bg-secondary/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl text-center space-y-4"
                    >
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                            <Navigation2 size={32} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-condensed">Enable Location</h3>
                            <p className="text-sm text-white/40 italic">"Find the closest pitches and see who's playing in real-time."</p>
                        </div>
                        <button onClick={requestPermission} className="w-full bg-primary text-background p-4 rounded-xl font-bold uppercase tracking-widest">
                            {geoStatus === 'denied' ? 'Re-enable in Settings' : 'Allow Location'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
