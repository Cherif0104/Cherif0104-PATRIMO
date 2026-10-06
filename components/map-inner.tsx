"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap, Marker } from "leaflet";
import { pinPrice } from "@/lib/format";
import type { Listing } from "@/lib/types";

type MapProps = {
  listings: Listing[];
  activeId?: string | null;
  hoveredId?: string | null;
  onSelect?: (id: string) => void;
};

export function MapView({ listings, activeId, hoveredId, onSelect }: MapProps) {
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  const listingsRef = useRef(listings);
  const fitted = useRef("");
  const [ready, setReady] = useState(false);
  onSelectRef.current = onSelect;
  listingsRef.current = listings;
  const signature = listings.map((listing) => `${listing.id}:${listing.price}:${listing.currency}`).join("|");

  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (disposed || !node.current || mapRef.current) return;
      const map = L.map(node.current, { scrollWheelZoom: true }).setView([14.72, -17.45], 11);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      const observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(node.current);
      setReady(true);
      if (disposed) {
        observer.disconnect();
        return;
      }
      map.on("unload", () => observer.disconnect());
    })();
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      const layer = layerRef.current;
      if (!map || !layer || cancelled) return;
      const current = listingsRef.current;
      layer.clearLayers();
      current.forEach((listing) => {
        const on = listing.id === activeId;
        const hot = listing.id === hoveredId;
        const icon = L.divIcon({
          className: "ameena-pin",
          html: `<div class="pin${on ? " on" : ""}${hot ? " hot" : ""}">${pinPrice(listing.price, listing.currency)}</div>`,
          iconSize: [78, 32],
          iconAnchor: [39, 16],
        });
        const marker = L.marker([listing.lat, listing.lng], {
          icon,
          zIndexOffset: on ? 1000 : hot ? 500 : 0,
        });
        marker.on("click", () => onSelectRef.current?.(listing.id));
        marker.addTo(layer);
      });
      if (current.length > 0 && fitted.current !== signature) {
        map.fitBounds(
          L.latLngBounds(current.map((listing) => [listing.lat, listing.lng] as [number, number])),
          { padding: [48, 48], maxZoom: 13 },
        );
        fitted.current = signature;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, signature, activeId, hoveredId]);

  useEffect(() => {
    const listing = listings.find((item) => item.id === activeId);
    if (listing && mapRef.current) mapRef.current.panTo([listing.lat, listing.lng]);
  }, [activeId, listings]);

  return <div ref={node} className="h-full w-full" />;
}

export function PickMap({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (disposed || !node.current || mapRef.current) return;
      const map = L.map(node.current).setView([lat, lng], 12);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        subdomains: "abcd",
      }).addTo(map);
      const marker = L.marker([lat, lng]).addTo(map);
      map.on("click", (event) => {
        marker.setLatLng(event.latlng);
        onChangeRef.current(Number(event.latlng.lat.toFixed(5)), Number(event.latlng.lng.toFixed(5)));
      });
      mapRef.current = map;
      markerRef.current = marker;
    })();
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Initial view only. Later coordinates are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    markerRef.current?.setLatLng([lat, lng]);
    mapRef.current?.panTo([lat, lng]);
  }, [lat, lng]);

  return <div ref={node} className="h-64 overflow-hidden rounded-2xl border border-[#ebebeb]" />;
}
