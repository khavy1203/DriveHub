import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const TEAL = '#00685d';
const RED = '#ba1a1a';
const MAX_POLYLINE_PTS = 100;

const simplifyPositions = (positions: [number, number][], maxPoints: number): [number, number][] => {
  if (positions.length <= maxPoints) return positions;
  const step = (positions.length - 1) / (maxPoints - 1);
  const result: [number, number][] = [];
  for (let i = 0; i < maxPoints - 1; i++) {
    result.push(positions[Math.round(i * step)]);
  }
  result.push(positions[positions.length - 1]);
  return result;
};

const FitBounds: React.FC<{ simplified: [number, number][] }> = ({ simplified }) => {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || simplified.length < 2) return;
    map.fitBounds(simplified, { padding: [32, 32] });
    fitted.current = true;
  }, [map, simplified]);
  return null;
};

type Props = {
  positions: [number, number][];
  center: [number, number];
};

const SessionRouteMap: React.FC<Props> = ({ positions, center }) => {
  const simplified = useMemo(
    () => simplifyPositions(positions, MAX_POLYLINE_PTS),
    [positions],
  );
  const start = positions[0];
  const end = positions[positions.length - 1];

  return (
    <MapContainer center={center} zoom={14} className="srm__map" zoomControl={false}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {positions.length >= 2 && (
        <>
          <Polyline positions={simplified} color={TEAL} weight={4} opacity={0.85} />
          <CircleMarker center={start} radius={9} fillColor={TEAL} color="white" weight={2} fillOpacity={1}>
            <Tooltip permanent direction="top" offset={[0, -12]} className="srm__map-tooltip">
              BẮT ĐẦU
            </Tooltip>
          </CircleMarker>
          <CircleMarker center={end} radius={9} fillColor={RED} color="white" weight={2} fillOpacity={1}>
            <Tooltip permanent direction="top" offset={[0, -12]} className="srm__map-tooltip srm__map-tooltip--end">
              KẾT THÚC
            </Tooltip>
          </CircleMarker>
        </>
      )}
      {positions.length >= 2 && <FitBounds simplified={simplified} />}
    </MapContainer>
  );
};

export default SessionRouteMap;
