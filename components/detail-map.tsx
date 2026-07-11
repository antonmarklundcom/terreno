'use client';

import dynamic from 'next/dynamic';
import type { Polygon } from 'geojson';
import type { MapMarker } from './listing-map';

const ListingMap = dynamic(() => import('./listing-map'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-map-sand" />,
});

/** Client wrapper so the detail (server) page can lazy-load the map. */
export function DetailMap({
  lat,
  lng,
  polygon,
  label,
  className,
}: {
  lat: number;
  lng: number;
  polygon?: Polygon;
  label: string;
  className?: string;
}) {
  const markers: MapMarker[] = polygon ? [] : [{ id: 'this', lat, lng, label }];
  return (
    <ListingMap
      markers={markers}
      polygon={polygon}
      center={[lng, lat]}
      zoom={15}
      selectedId="this"
      className={className}
      showZoom
    />
  );
}
