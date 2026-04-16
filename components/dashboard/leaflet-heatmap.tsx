"use client";

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Tooltip, Popup } from 'react-leaflet';
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
  const [activePopup, setActivePopup] = useState<{ name: string; pos: L.LatLng } | null>(null);

  useEffect(() => {
    setIsClient(true);
    fixLeafletIcon();
  }, []);

  // Mapping GeoJSON names → database kabupaten names
  const GEOJSON_TO_DB_NAME: Record<string, string> = {
    'PALANGKA RAYA': 'KOTA PALANGKA RAYA',
    'KOTAWARINGIN TIMUR': 'KOTAWARINGIN TIMUR',
    'KOTAWARINGIN BARAT': 'KOTAWARINGIN BARAT',
    'KAPUAS': 'KAPUAS',
    'SERUYAN': 'SERUYAN',
    'KATINGAN': 'KATINGAN',
    'LAMANDAU': 'LAMANDAU',
    'BARITO UTARA': 'BARITO UTARA',
    'GUNUNG MAS': 'GUNUNG MAS',
    'PULANG PISAU': 'PULANG PISAU',
    'BARITO TIMUR': 'BARITO TIMUR',
    'SUKAMARA': 'SUKAMARA',
    'BARITO SELATAN': 'BARITO SELATAN',
    'MURUNG RAYA': 'MURUNG RAYA',
  };

  const { heatPoints, cityMarkers } = useMemo(() => {
    if (!data.length) return { heatPoints: [], cityMarkers: [] };

    const maxTunggakan = Math.max(...data.map(d => d.tunggakan), 1);
    const points: [number, number, number][] = [];
    const markers: any[] = [];

    KALTENG_GEOJSON.features.forEach(feature => {
      const geoName = feature.properties.name;
      // Try exact match first, then mapped name, then partial match
      const dbName = GEOJSON_TO_DB_NAME[geoName] || geoName;
      const cityData = data.find(c => 
        c.name === dbName || 
        c.name === geoName ||
        c.name.includes(geoName) ||
        geoName.includes(c.name.replace('KOTA ', '').replace('KABUPATEN ', ''))
      );
      
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
        name: cityData.name,
        geoLabel: geoName,
        value: cityData.tunggakan
      });

      const normalizedInt = cityData.tunggakan / maxTunggakan;
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

  const geojsonStyle = (isHovered = false) => ({
    fillColor: isHovered ? '#6366f1' : 'transparent',
    weight: isHovered ? 2 : 1,      
    opacity: isHovered ? 0.8 : 0.2,    
    color: isHovered ? '#4f46e5' : '#94a3b8',
    fillOpacity: isHovered ? 0.05 : 0,
    className: 'cursor-pointer'
  });

  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      mouseover: (e: any) => {
        e.target.setStyle(geojsonStyle(true));
      },
      mouseout: (e: any) => {
        e.target.setStyle(geojsonStyle(false));
      },
      click: (e: any) => {
        const geoName = feature.properties.name;
        const dbName = GEOJSON_TO_DB_NAME[geoName] || geoName;
        // Find best matching name in actual data
        const match = data.find(c => 
          c.name === dbName || 
          c.name === geoName ||
          c.name.includes(geoName) ||
          geoName.includes(c.name.replace('KOTA ', '').replace('KABUPATEN ', ''))
        );
        setActivePopup({
          name: match?.name || geoName,
          pos: e.latlng
        });
      }
    });
  };

  return (
    <Card className="h-full border-slate-200/60 shadow-sm overflow-hidden relative group">
      <CardHeader className="pb-2 bg-white/90 backdrop-blur-md absolute top-0 left-0 right-0 z-[1000] border-b border-slate-100">
        <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-widest flex items-center justify-between">
          <span>Peta Konsentrasi Tunggakan Pajak</span>
          <span className="text-[10px] text-slate-400 font-medium">Klik wilayah untuk detail</span>
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
            style={() => geojsonStyle(false)}
            onEachFeature={onEachFeature}
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
                className="bg-white/80 border border-slate-100 shadow-sm rounded-md p-1 px-1.5 backdrop-blur-sm pointer-events-none"
                offset={[0, 0]}
              >
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">{marker.name}</span>
                  <span className="text-[10px] font-black text-slate-700 leading-none">{formatNumber(marker.value)}</span>
                </div>
              </Tooltip>
            </Marker>
          ))}

          {activePopup && (() => {
            // Fuzzy match: handle GeoJSON name vs DB name mismatch
            const cityData = data.find(c => 
              c.name === activePopup.name ||
              c.name.includes(activePopup.name) ||
              activePopup.name.includes(c.name.replace('KOTA ', '').replace('KABUPATEN ', ''))
            );
            const kepatuhan = cityData && cityData.potensi > 0 
              ? (((cityData.potensi - cityData.tunggakan) / cityData.potensi) * 100).toFixed(1) 
              : "0";
            const displayName = cityData?.name || activePopup.name;
            
            return (
              <Popup position={activePopup.pos} maxWidth={280} className="custom-popup" eventHandlers={{ remove: () => setActivePopup(null) }}>
                <div className="p-3 min-w-[220px] bg-white rounded-xl space-y-3">
                  <div className="border-b border-slate-50 pb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wilayah Samsat</p>
                    <h4 className="text-sm font-black text-indigo-600 leading-tight uppercase">{displayName}</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Potensi</p>
                      <p className="text-xs font-bold text-slate-700">Rp {formatNumber(cityData?.potensi || 0)}jt</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-rose-400 uppercase">Tunggakan</p>
                      <p className="text-xs font-bold text-rose-600">Rp {formatNumber(cityData?.tunggakan || 0)}jt</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-end">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Tingkat Kepatuhan</p>
                      <p className="text-xs font-black text-emerald-600">{kepatuhan}%</p>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${kepatuhan}%` }} 
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 italic font-medium leading-tight">Berbasis realisasi PKB terhadap total potensi kendaraan.</p>
                  </div>
                </div>
              </Popup>
            );
          })()}
        </MapContainer>

        <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-2xl space-y-3">
          <p className="text-[13px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Informasi Visual</p>
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[13px] font-bold text-slate-400">KERAPATAN TUNGGAKAN</span>
              <div className="h-2.5 w-40 rounded-full bg-gradient-to-r from-blue-500 via-green-500 via-yellow-400 to-red-500 shadow-inner" />
              <div className="flex justify-between text-[13px] font-bold text-slate-400 px-0.5">
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



