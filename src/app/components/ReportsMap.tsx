"use client";

import { useEffect, useRef, useState } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

type Report = {
  report_id: string | number;
  report_title: string | null;
  report_description: string | null;
  report_image: string | null;
  category_id: number | null;
  location_geojson: { type: "Point"; coordinates: [number, number] } | null;
};

function categoryToColor(categoryId: number | null) {
  if (categoryId === 1) return "red";
  if (categoryId === 4) return "yellow";
  return "green";
}

export default function ReportsMap({ reports }: { reports: Report[] }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

    if (!key) {
      console.error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
      return;
    }

    let markers: google.maps.Marker[] = [];
    let clusterer: MarkerClusterer | null = null;
    let infoWindow: google.maps.InfoWindow | null = null;
    let hoverWindow: google.maps.InfoWindow | null = null;

    function loadScript() {
      return new Promise<void>((resolve, reject) => {
        if ((window as any).google?.maps) return resolve();

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Google Maps script"));
        document.head.appendChild(script);
      });
    }

    async function init() {
      await loadScript();
      if (!mapRef.current) return;

      const google = (window as any).google as typeof window.google;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 33.7175, lng: -117.8311 },
        zoom: 10,
        ...(mapId ? { mapId } : {}),
      });

      mapInstanceRef.current = map;
      infoWindow = new google.maps.InfoWindow();
      hoverWindow = new google.maps.InfoWindow();

      const validReports = (reports ?? []).filter((r) => {
        const coords = r.location_geojson?.coordinates;
        if (!coords || coords.length !== 2) return false;
        const [lng, lat] = coords;
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
        if (lng === 0 && lat === 0) return false;
        return true;
      });

      markers = validReports.map((r) => {
        const [lng, lat] = r.location_geojson!.coordinates;
        const color = categoryToColor(r.category_id);

        const marker = new google.maps.Marker({
          map,
          position: { lat, lng },
          title: r.report_title ?? "Report",
          icon: {
            url: `https://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
            scaledSize: new google.maps.Size(40, 40),
          },
        });

        marker.addListener("mouseover", () => {
          hoverWindow!.setContent(`
            <div style="font-family: Arial; max-width: 220px; padding: 0; margin: 0;">
              <div style="margin:0; padding:0; font-weight:700; font-size:14px; line-height:1.2;">
                ${r.report_title ?? "Report"}
              </div>
              <div style="margin:4px 0 0 0; font-size:12px; line-height:1.35;">
                ${r.report_description ?? "No description provided."}
              </div>
            </div>
          `);
          hoverWindow!.open({
            map,
            anchor: marker,
            shouldFocus: false,
          });
        });

        marker.addListener("mouseout", () => {
          hoverWindow!.close();
        });

        marker.addListener("click", () => {
          infoWindow!.setContent(`
            <div style="font-family: Arial; max-width: 260px; padding: 0; margin: 0;">
              <div style="margin:0; padding:0; font-weight:700; font-size:16px; line-height:1.2;">
                ${r.report_title ?? "Report"}
              </div>
              <div style="margin:6px 0 0 0; font-size:13px; line-height:1.35;">
                ${r.report_description ?? ""}
              </div>
              <div style="margin:8px 0 0 0; font-size:12px; opacity:.7;">
                Category: ${r.category_id ?? "N/A"} • Report ID: ${r.report_id}
              </div>
            </div>
          `);
          infoWindow!.open({
            map,
            anchor: marker,
            shouldFocus: false,
          });
        });

        return marker;
      });

      clusterer = new MarkerClusterer({ map, markers });
    }

    init().catch(console.error);

    return () => {
      if (clusterer) clusterer.setMap(null);
      if (infoWindow) infoWindow.close();
      if (hoverWindow) hoverWindow.close();
      markers.forEach((m) => m.setMap(null));
      markers = [];
    };
  }, [reports]);

  function handleUseCurrentLocation() {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const google = (window as any).google as typeof window.google;
        const map = mapInstanceRef.current;
        if (!map || !google) return;

        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        map.panTo(userPos);
        map.setZoom(14);

        if (userMarkerRef.current) {
          userMarkerRef.current.setMap(null);
        }

        userMarkerRef.current = new google.maps.Marker({
          map,
          position: userPos,
          title: "Your current location",
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            scaledSize: new google.maps.Size(42, 42),
          },
        });
      },
      () => {
        setLocationError("Location access was denied or unavailable.");
      }
    );
  }

  
  return (
    <div style={{ width: "100%", maxWidth: "700px", margin: "24px auto" }}>
      <div style={{ marginBottom: "12px", display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleUseCurrentLocation}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            background: "white",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Use My Current Location
        </button>
      </div>

      {locationError ? (
        <div style={{ marginBottom: "8px", fontSize: "14px", color: "#b91c1c" }}>
          {locationError}
        </div>
      ) : null}

      <div
        ref={mapRef}
        style={{
          height: "400px",
          width: "100%",
          border: "none",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      />
    </div>
  );
}