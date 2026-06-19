'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { type Map as MlMap, type LngLatBoundsLike } from 'maplibre-gl';
import type { Polygon } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface MapMarker {
  id: string;
  lng: number;
  lat: number;
  label: string;
  href?: string;
}

interface ListingMapProps {
  markers?: MapMarker[];
  polygon?: Polygon;
  center?: [number, number];
  zoom?: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  className?: string;
  fitToMarkers?: boolean;
  showZoom?: boolean;
}

/**
 * Real interactive map (MapLibre GL + free Carto raster tiles, no API key).
 * Styled to the calm neutral palette via the Positron basemap. Pins show price;
 * the active/selected pin is dark with white text (per design).
 *
 * This is a Client Component used for interactivity only — it receives its data
 * as props from Server Components. It never fetches listing data itself.
 */

// Carto "Positron" raster basemap — free, no key, calm light palette.
const RASTER_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
};

export default function ListingMap({
  markers = [],
  polygon,
  center,
  zoom = 13,
  selectedId,
  onSelect,
  onHover,
  className,
  fitToMarkers = false,
  showZoom = true,
}: ListingMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerEls = useRef<Map<string, HTMLButtonElement>>(new Map());

  const fallbackCenter: [number, number] =
    center ??
    (markers.length
      ? [markers[0].lng, markers[0].lat]
      : [-57.5759, -25.3]); // Gran Asunción

  // Init once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: RASTER_STYLE,
      center: fallbackCenter,
      zoom,
      attributionControl: { compact: true },
    });
    if (showZoom) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    }
    mapRef.current = map;

    map.on('load', () => {
      // Parcel polygon (detail page).
      if (polygon) {
        map.addSource('parcel', {
          type: 'geojson',
          data: { type: 'Feature', geometry: polygon, properties: {} },
        });
        map.addLayer({
          id: 'parcel-fill',
          type: 'fill',
          source: 'parcel',
          paint: { 'fill-color': '#1f6b4a', 'fill-opacity': 0.16 },
        });
        map.addLayer({
          id: 'parcel-line',
          type: 'line',
          source: 'parcel',
          paint: { 'line-color': '#1f6b4a', 'line-width': 2 },
        });
        const coords = polygon.coordinates[0];
        const bounds = coords.reduce(
          (b, c) => b.extend([c[0], c[1]] as [number, number]),
          new maplibregl.LngLatBounds(
            [coords[0][0], coords[0][1]],
            [coords[0][0], coords[0][1]],
          ),
        );
        map.fitBounds(bounds, { padding: 60, maxZoom: 16, duration: 0 });
      }
    });

    // Price pin markers.
    markers.forEach((m) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'tnum';
      el.dataset.id = m.id;
      el.textContent = m.label;
      el.style.cssText =
        'font-family:inherit;font-size:12px;font-weight:700;padding:4px 9px;border-radius:20px;border:none;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2);background:#fff;color:#16170f;white-space:nowrap;';
      el.addEventListener('click', () => onSelect?.(m.id));
      el.addEventListener('mouseenter', () => onHover?.(m.id));
      el.addEventListener('mouseleave', () => onHover?.(null));
      markerEls.current.set(m.id, el);
      new maplibregl.Marker({ element: el }).setLngLat([m.lng, m.lat]).addTo(map);
    });

    if (fitToMarkers && markers.length > 1) {
      const bounds = new maplibregl.LngLatBounds(
        [markers[0].lng, markers[0].lat],
        [markers[0].lng, markers[0].lat],
      );
      markers.forEach((m) => bounds.extend([m.lng, m.lat]));
      map.fitBounds(bounds as LngLatBoundsLike, {
        padding: 48,
        maxZoom: 14,
        duration: 0,
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerEls.current.clear();
    };
    // Init effect — run once for a given marker set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect selection/hover in pin styling.
  useEffect(() => {
    markerEls.current.forEach((el, id) => {
      const active = id === selectedId;
      el.style.background = active ? '#16170f' : '#fff';
      el.style.color = active ? '#fff' : '#16170f';
      el.style.zIndex = active ? '2' : '1';
    });
  }, [selectedId]);

  return <div ref={containerRef} className={className} />;
}
