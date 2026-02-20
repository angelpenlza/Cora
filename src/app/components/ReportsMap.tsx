"use client";

import { useEffect, useRef } from "react";

export default function ReportsMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      console.error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
      return;
    }

    // Avoid adding the script multiple times on hot reloads
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps="true"]'
    );
    if (existing && (window as any).google?.maps) {
      initMap();
      return;
    }

    const script = document.createElement("script");
    script.dataset.googleMaps = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
    script.async = true;

    script.onload = () => initMap();
    document.head.appendChild(script);

    function initMap() {
      if (!mapRef.current) return;
      const google = (window as any).google;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 33.7175, lng: -117.8311 },
        zoom: 10,
      });

      const infoWindow = new google.maps.InfoWindow();
      const geocoder = new google.maps.Geocoder();

      const reports = [
        {
          address: "800 N State College Blvd, Fullerton, CA",
          status: "Unverified",
          color: "yellow",
          title: "Unverified Report",
          details: "Needs moderator review.",
        },
        {
          address: "670 Spectrum Drive, Irvine, CA",
          status: "Verified",
          color: "green",
          title: "Verified Report",
          details: "Confirmed incident.",
        },
        {
          address: "1614 W Katella Ave, Anaheim, CA",
          status: "Spam Likely",
          color: "red",
          title: "Spam Likely",
          details: "Flagged for suspicious content.",
        },
      ];

      reports.forEach((report) => {
        geocoder.geocode({ address: report.address }, (results: any, status: any) => {
          if (status === "OK" && results?.[0]) {
            const marker = new google.maps.Marker({
              map,
              position: results[0].geometry.location,
              title: report.title,
              icon: {
                url: `https://maps.google.com/mapfiles/ms/icons/${report.color}-dot.png`,
                scaledSize: new google.maps.Size(40, 40),
              },
            });

            marker.addListener("click", () => {
              infoWindow.setContent(`
                <div style="font-family: Arial; max-width: 250px;">
                  <div style="font-weight:700; font-size:16px; margin-bottom:6px;">${report.title}</div>
                  <div><b>Status:</b> ${report.status}</div>
                  <div style="margin-top:6px;">${report.details}</div>
                  <div style="margin-top:8px; font-size:12px; opacity:.7;">${report.address}</div>
                </div>
              `);
              infoWindow.open(map, marker);
            });
          } else {
            console.error("Geocode failed:", status, report.address);
          }
        });
      });
    }
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        height: "400px",
        width: "100%",
        maxWidth: "700px",
        margin: "24px auto",
        border: "3px solid blue",
      }}
    />
  );
}