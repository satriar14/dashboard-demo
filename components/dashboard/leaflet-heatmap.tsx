"use client";

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// @ts-ignore
import 'leaflet.heat';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CityData, formatNumber } from "@/lib/data";
import { KALTENG_GEOJSON } from "@/lib/kalteng-geojson";

const fixLeafletIcon = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

function HeatLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;

    // @ts-ignore
    const heatLayer = L.heatLayer(points, {
      radius: 70,    
      blur: 40,      
      max: 0.35,      // Sensitivity boost
      minOpacity: 0.1,
      gradient: {
        0.1: '#3b82f6', 
        0.3: '#10b981', 
        0.5: '#facc15', 
        0.7: '#f97316', 
        0.9: '#ef4444'  
      }
    }).addTo(map);

    return () => {
      if (map && heatLayer) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, points]);

  return null;
}

interface LeafletHeatmapProps {
  data: CityData[];
}

export default function LeafletHeatmap({ data }: LeafletHeatmapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fixLeafletIcon();
  }, []);

  const { heatPoints, cityMarkers } = useMemo(() => {
    if (!data.length) return { heatPoints: [], cityMarkers: [] };

    const maxPotensi = Math.max(...data.map(d => d.potensi), 1);
    const points: [number, number, number][] = [];
    const markers: any[] = [];

    KALTENG_GEOJSON.features.forEach(feature => {
      const cityName = feature.properties.name;
      const cityData = data.find(c => c.name === cityName);
      
      if (!cityData) return;

      const coords = feature.geometry.coordinates[0];
      let sumLat = 0, sumLng = 0;
      const count = coords.length - 1;
      for (let i = 0; i < count; i++) {
        sumLng += coords[i][0];
        sumLat += coords[i][1];
      }
      const centerLat = sumLat / count;
      const centerLng = sumLng / count;

      markers.push({
        position: [centerLat, centerLng],
        name: cityName,
        value: cityData.potensi
      });

      const normalizedInt = cityData.potensi / maxPotensi;
      const numPoints = Math.floor(normalizedInt * 60) + 20; 

      for (let i = 0; i < numPoints; i++) {
        // More concentrated jitter
        const jitterLat = (Math.random() - 0.5) * 0.35; 
        const jitterLng = (Math.random() - 0.5) * 0.35;
        points.push([centerLat + jitterLat, centerLng + jitterLng, normalizedInt]);
      }
    });

    return { heatPoints: points, cityMarkers: markers };
  }, [data]);

  if (!isClient) return <div className="h-[400px] w-full bg-slate-100 animate-pulse rounded-xl" />;

  const geojsonStyle = () => ({
    fillColor: 'transparent',
    weight: 1,      
    opacity: 0.2,    
    color: '#94a3b8',
    fillOpacity: 0
  });

  return (
    <Card className="h-full border-slate-200/60 shadow-sm overflow-hidden relative group">
      <CardHeader className="pb-2 bg-white/90 backdrop-blur-md absolute top-0 left-0 right-0 z-[1000] border-b border-slate-100">
        <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-widest flex items-center justify-between">
          <span>Peta Konsentrasi Potensi PKB</span>
          <span className="text-[10px] text-slate-400 font-medium">Data Real-time</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[550px]">
        <MapContainer
          center={[-1.68, 113.38]}
          zoom={7}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', background: '#f1f5f9' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <HeatLayer points={heatPoints} />
          
          <GeoJSON
            data={KALTENG_GEOJSON as any}
            style={geojsonStyle}
          />

          {cityMarkers.map((marker, i) => (
            <Marker 
              key={i} 
              position={marker.position} 
              icon={L.divIcon({ className: 'bg-transparent', iconSize: [0, 0] })}
            >
              <Tooltip 
                permanent 
                direction="center" 
                className="bg-white/90 border border-slate-200 shadow-md rounded-lg p-1.5 px-2 backdrop-blur-sm"
                offset={[0, 0]}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase leading-none">{marker.name}</span>
                  <span className="text-[11px] font-black text-indigo-600 leading-none">Rp {formatNumber(marker.value)}jt</span>
                </div>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>

        <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-2xl space-y-3">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Informasi Visual</p>
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400">KERAPATAN POTENSI</span>
              <div className="h-2.5 w-40 rounded-full bg-gradient-to-r from-blue-500 via-green-500 via-yellow-400 to-red-500 shadow-inner" />
              <div className="flex justify-between text-[8px] font-bold text-slate-400 px-0.5">
                <span>RENDAH</span>
                <span>TINGGI</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



