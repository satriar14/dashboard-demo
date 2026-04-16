"use client";

import { useEffect, useState, useMemo, useId } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// @ts-ignore
import 'leaflet.heat';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CityData, formatNumber, HeatmapPoint } from "@/lib/data";

const fixLeafletIcon = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

function HeatLayer({ points, colorScheme = 'arrears' }: { points: [number, number, number][]; colorScheme?: 'arrears' | 'payments' }) {
  const map = useMap();

  const gradients = {
    arrears: {
      0.1: '#3b82f6',
      0.3: '#10b981',
      0.5: '#facc15',
      0.7: '#f97316',
      0.9: '#ef4444'
    },
    payments: {
      0.1: '#a7f3d0',
      0.3: '#34d399',
      0.5: '#10b981',
      0.7: '#059669',
      0.9: '#047857'
    }
  };

  useEffect(() => {
    if (!map || !points.length) return;

    // @ts-ignore
    const heatLayer = L.heatLayer(points, {
      radius: 70,
      blur: 40,
      max: 0.35,
      minOpacity: 0.15,
      gradient: gradients[colorScheme]
    }).addTo(map);

    return () => {
      if (map && heatLayer) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, points, colorScheme]);

  return null;
}

interface LeafletHeatmapProps {
  points: HeatmapPoint[];
  title?: string;
  subtitle?: string;
  metricLabel?: string;
  metricUnit?: string;
  colorScheme?: 'arrears' | 'payments';
}

/**
 * Controller to handle auto-zooming to bounds
 */
function MapBoundsController({ markers }: { markers: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || markers.length === 0) return;

    const bounds = L.latLngBounds(markers.map(m => m.position));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10, animate: true });
  }, [map, markers]);

  return null;
}

export default function LeafletHeatmap({
  points: heatmapData,
  title = 'Peta Konsentrasi Tunggakan Pajak',
  subtitle = 'Fokus Wilayah Aktif',
  metricLabel = 'Total Tunggakan Terdeteksi',
  metricUnit = 'jt',
  colorScheme = 'arrears'
}: LeafletHeatmapProps) {
  const mapId = useId();
  const [isClient, setIsClient] = useState(false);
  const [activePopup, setActivePopup] = useState<{ name: string; pos: L.LatLng } | null>(null);

  useEffect(() => {
    setIsClient(true);
    fixLeafletIcon();
  }, []);

  const { heatPoints, cityMarkers } = useMemo(() => {
    if (!heatmapData.length) return { heatPoints: [], cityMarkers: [] };

    const maxValue = Math.max(...heatmapData.map(d => d.value), 0.1);
    const points: [number, number, number][] = [];
    const markers: any[] = [];

    heatmapData.forEach(item => {
      markers.push({
        position: [item.lat, item.lng],
        name: item.name,
        value: item.value
      });

      const normalizedInt = item.value / maxValue;
      // Spread some points around the center for better heat density
      const numPoints = Math.floor(normalizedInt * 40) + 15; 

      for (let i = 0; i < numPoints; i++) {
        const jitterLat = (Math.random() - 0.5) * 0.08; 
        const jitterLng = (Math.random() - 0.5) * 0.08;
        points.push([item.lat + jitterLat, item.lng + jitterLng, normalizedInt]);
      }
    });

    return { 
      heatPoints: points, 
      cityMarkers: markers
    };
  }, [heatmapData]);

  if (!isClient) return <div className="h-[400px] w-full bg-slate-100 animate-pulse rounded-xl" />;



  const accentColor = colorScheme === 'payments' ? 'text-emerald-600' : 'text-indigo-600';
  const accentBg = colorScheme === 'payments' ? 'bg-emerald-50' : 'bg-rose-50';
  const valueColor = colorScheme === 'payments' ? 'text-emerald-600' : 'text-rose-600';
  const markerBg = colorScheme === 'payments' ? 'bg-emerald-600/90 border-emerald-400' : 'bg-indigo-600/90 border-indigo-400';

  return (
    <Card className="h-full border-slate-200/60 shadow-sm overflow-hidden relative group">
      <CardHeader className="pb-2 bg-white/90 backdrop-blur-md absolute top-0 left-0 right-0 z-[1000] border-b border-slate-100">
        <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-widest flex items-center justify-between">
          <span>{title}</span>
          <span className="text-[10px] text-slate-400 font-medium">{subtitle}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[550px]">
        <MapContainer
          key={mapId}
          center={[-1.68, 113.38]}
          zoom={7}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', background: '#f1f5f9' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <MapBoundsController markers={cityMarkers} />
          <HeatLayer points={heatPoints} colorScheme={colorScheme} />
          


          {cityMarkers.map((marker, i) => (
            <Marker 
              key={i} 
              position={marker.position} 
              icon={L.divIcon({ 
                className: 'bg-transparent', 
                iconSize: [0, 0],
                html: `<div class="p-1 px-2 ${markerBg} text-white text-[9px] font-bold rounded shadow-lg border whitespace-nowrap -translate-x-1/2 -translate-y-full">${marker.name}</div>`
              })}
            >
              <Tooltip 
                permanent={false} 
                direction="top" 
                className="bg-white/95 border border-slate-200 shadow-xl rounded-xl p-2 px-3 backdrop-blur-md"
                offset={[0, -10]}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tighter leading-none">{colorScheme === 'payments' ? 'Kantor SAMSAT' : 'Kecamatan'}</span>
                  <span className="text-sm font-black text-slate-800 leading-none">{marker.name}</span>
                  <div className="w-full h-[1px] bg-slate-100 my-1" />
                  <span className={`text-xs font-black ${accentColor} leading-none`}>Rp {formatNumber(marker.value)}{metricUnit}</span>
                </div>
              </Tooltip>
              <Popup eventHandlers={{ remove: () => setActivePopup(null) }}>
                <div className="p-4 min-w-[200px] bg-white rounded-2xl space-y-3">
                    <div className="border-b border-slate-50 pb-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{colorScheme === 'payments' ? 'Kantor Pembayaran Pajak' : 'Detail Wilayah (Kecamatan)'}</p>
                      <h4 className={`text-lg font-black ${accentColor} leading-tight uppercase`}>{marker.name}</h4>
                    </div>
                    <div className={`${accentBg} p-3 rounded-xl`}>
                      <p className={`text-[10px] font-bold ${valueColor} uppercase tracking-wider mb-1 opacity-70`}>{metricLabel}</p>
                      <p className={`text-xl font-black ${valueColor}`}>Rp {formatNumber(marker.value)}{metricUnit}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">{colorScheme === 'payments' ? `Total PKB yang terkumpul melalui ${marker.name}.` : `Data tunggakan di wilayah ${marker.name}.`}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-2xl space-y-3">
          <p className="text-[13px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Informasi Visual</p>
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[13px] font-bold text-slate-400">{colorScheme === 'payments' ? 'VOLUME PEMBAYARAN' : 'KERAPATAN TUNGGAKAN'}</span>
              {colorScheme === 'payments' ? (
                <div className="h-2.5 w-40 rounded-full bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-700 shadow-inner" />
              ) : (
                <div className="h-2.5 w-40 rounded-full bg-gradient-to-r from-blue-500 via-green-500 via-yellow-400 to-red-500 shadow-inner" />
              )}
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



