"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Report } from "./mapTypes";
import {
  CATEGORY_OPTIONS,
  categoryToIcon,
  categoryToLabel,
  formatReportDate,
  scoreToStatus,
  statusToColor,
} from "./mapHelpers";
import { styles } from "./mapStyles";

export default function ReportsMap({ reports }: { reports: Report[] }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const [locationError, setLocationError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    CATEGORY_OPTIONS.map((c) => c.id)
  );

  const [statusFilters, setStatusFilters] = useState({
    supported: true,
    unconfirmed: true,
    disputed: true,
  });

  const filteredReports = useMemo(() => {
    return (reports ?? []).filter((r) => {
      const coords = r.location_geojson?.coordinates;
      if (!coords || coords.length !== 2) return false;

      const [lng, lat] = coords;
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
      if (lng === 0 && lat === 0) return false;

      if (r.category_id == null) return false;
      if (!selectedCategories.includes(r.category_id)) return false;

      const status = scoreToStatus(r.score);
      if (status === "supported" && !statusFilters.supported) return false;
      if (status === "unconfirmed" && !statusFilters.unconfirmed) return false;
      if (status === "disputed" && !statusFilters.disputed) return false;

      return true;
    });
  }, [reports, selectedCategories, statusFilters]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

    if (!key) {
      console.error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
      return;
    }

    let markers: google.maps.marker.AdvancedMarkerElement[] = [];
    let clusterer: MarkerClusterer | null = null;
    let infoWindow: google.maps.InfoWindow | null = null;
    let hoverWindow: google.maps.InfoWindow | null = null;

    function loadScript() {
      return new Promise<void>((resolve, reject) => {
        if ((window as any).google?.maps?.marker) return resolve();

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=marker`;
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
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      mapInstanceRef.current = map;
      geocoderRef.current = new google.maps.Geocoder();
      infoWindow = new google.maps.InfoWindow();
      hoverWindow = new google.maps.InfoWindow();

      markers = filteredReports.map((r) => {
        const [lng, lat] = r.location_geojson!.coordinates;
        const status = scoreToStatus(r.score);
        const color = statusToColor(status);
        const iconPath = categoryToIcon(r.category_id);

        const markerElement = document.createElement("div");
        markerElement.style.width = "42px";
        markerElement.style.height = "42px";
        markerElement.style.borderRadius = "50%";
        markerElement.style.display = "flex";
        markerElement.style.alignItems = "center";
        markerElement.style.justifyContent = "center";
        markerElement.style.background = color;
        markerElement.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
        markerElement.style.border = "3px solid white";
        markerElement.style.cursor = "pointer";

        const icon = document.createElement("img");
        if (iconPath) {
          icon.src = iconPath;
          icon.style.width = "20px";
          icon.style.height = "20px";
          markerElement.appendChild(icon);
        }

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat, lng },
          content: markerElement,
        });

        markerElement.addEventListener("mouseenter", () => {
          hoverWindow!.setContent(`
            <div style="
              font-family: Inter, Arial, sans-serif;
              max-width: 220px;
              padding: 6px 8px;
              line-height: 1.3;
            ">
              <div style="font-weight:700; font-size:13px; margin-bottom:2px;">
                ${r.report_title ?? "Report"}
              </div>
              <div style="font-size:12px; opacity:.82;">
                ${(r.report_description ?? "No description provided.").slice(0, 70)}
              </div>
            </div>
          `);

          hoverWindow!.open({
            map,
            anchor: marker,
            shouldFocus: false,
          });
        });

        markerElement.addEventListener("mouseleave", () => {
          hoverWindow!.close();
        });

        markerElement.addEventListener("click", () => {
          const badgeText =
            status === "supported"
              ? "SUPPORTED"
              : status === "disputed"
              ? "DISPUTED"
              : "UNCONFIRMED";

          const badgeBg =
            status === "supported"
              ? "#E7F7EE"
              : status === "disputed"
              ? "#FFF1E7"
              : "#FFF9DB";

          const badgeColor =
            status === "supported"
              ? "#0B6B3A"
              : status === "disputed"
              ? "#D97706"
              : "#8A6D00";

          infoWindow!.setContent(`
            <div style="
              font-family: Inter, Arial, sans-serif;
              width: 320px;
              background: white;
              border-radius: 12px;
              padding: 16px;
              box-shadow: 0 6px 16px rgba(0,0,0,0.25);
            ">
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                <div style="
                  width:34px;
                  height:34px;
                  border-radius:50%;
                  background:#E6EDF3;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  flex-shrink:0;
                ">
                  ${
                    iconPath
                      ? `<img src="${iconPath}" style="width:18px;height:18px;" />`
                      : ``
                  }
                </div>

                <div style="
                  font-weight:700;
                  font-size:20px;
                  letter-spacing:0.5px;
                  color:#1E293B;
                ">
                  ${categoryToLabel(r.category_id).toUpperCase()}
                </div>

                <div style="
                  margin-left:auto;
                  background:${badgeBg};
                  color:${badgeColor};
                  font-size:12px;
                  font-weight:700;
                  padding:4px 10px;
                  border-radius:999px;
                  border:1px solid ${badgeColor}33;
                  white-space:nowrap;
                ">
                  ● ${badgeText}
                </div>
              </div>

              <div style="
                font-weight:700;
                font-size:18px;
                margin-bottom:6px;
                color:#1E293B;
              ">
                ${r.report_title ?? ""}
              </div>

              <div style="
                font-size:14px;
                line-height:1.45;
                color:#334155;
                margin-bottom:12px;
              ">
                ${r.report_description ?? ""}
              </div>

              <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                font-size:13px;
                color:#475569;
              ">
                <div>${formatReportDate(r.created_at)}</div>
                <div style="text-decoration:underline; cursor:pointer;">see more</div>
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
      markers.forEach((m) => {
        m.map = null;
      });
      markers = [];
    };
  }, [filteredReports]);

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

  function handleSearchLocation() {
    setLocationError("");
    const map = mapInstanceRef.current;
    const geocoder = geocoderRef.current;

    if (!map || !geocoder || !searchQuery.trim()) return;

    geocoder.geocode({ address: searchQuery }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const location = results[0].geometry.location;
        map.panTo(location);
        map.setZoom(14);
      } else {
        setLocationError("Could not find that location.");
      }
    });
  }

  function toggleCategory(categoryId: number) {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  }

  function toggleStatus(key: "supported" | "unconfirmed" | "disputed") {
    setStatusFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function resetAllFilters() {
    setSelectedCategories(CATEGORY_OPTIONS.map((c) => c.id));
    setStatusFilters({
      supported: true,
      unconfirmed: true,
      disputed: true,
    });
  }

  return (
    <div style={styles.wrapper}>
      <div ref={mapRef} style={styles.map} />

      <div
        style={{
          ...styles.filterPanel,
          width: filtersOpen ? "280px" : "220px",
        }}
      >
        <button
          onClick={() => setFiltersOpen((prev) => !prev)}
          style={styles.filterHeaderButton}
        >
          <span>Filters</span>
          <span style={{ fontSize: "22px", lineHeight: 1 }}>
            {filtersOpen ? "⌃" : "⌄"}
          </span>
        </button>

        {filtersOpen && (
          <div style={styles.filterBody}>
            <div style={{ marginBottom: "22px" }}>
              <div style={styles.sectionTitle}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#F59E0B",
                    display: "inline-block",
                  }}
                />
                Timeframe
              </div>

              <div style={styles.optionGrid}>
                <label><input type="radio" name="timeframe" disabled /> Daily</label>
                <label><input type="radio" name="timeframe" disabled defaultChecked /> Weekly</label>
                <label><input type="radio" name="timeframe" disabled /> Monthly</label>
              </div>
            </div>

            <div style={{ marginBottom: "22px" }}>
              <div style={styles.sectionTitle}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#16A34A",
                    display: "inline-block",
                  }}
                />
                Report Status
              </div>

              <div style={styles.optionGrid}>
                <label>
                  <input
                    type="checkbox"
                    checked={statusFilters.supported}
                    onChange={() => toggleStatus("supported")}
                  />{" "}
                  Community Supported
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={statusFilters.unconfirmed}
                    onChange={() => toggleStatus("unconfirmed")}
                  />{" "}
                  Unconfirmed
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={statusFilters.disputed}
                    onChange={() => toggleStatus("disputed")}
                  />{" "}
                  Disputed
                </label>
              </div>
            </div>

            <div style={{ marginBottom: "26px" }}>
              <div style={styles.sectionTitle}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#6F8F9F",
                    display: "inline-block",
                  }}
                />
                Category
              </div>

              <div style={styles.categoryGrid}>
                {CATEGORY_OPTIONS.map((category) => (
                  <label
                    key={category.id}
                    style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                    />
                    {category.label}
                  </label>
                ))}
              </div>
            </div>

            <button onClick={resetAllFilters} style={styles.resetButton}>
              RESET ALL FILTERS
            </button>
          </div>
        )}
      </div>

      <div style={styles.searchWrapper}>
        <div style={styles.searchBar}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchLocation();
            }}
            placeholder="Search by location..."
            style={styles.searchInput}
          />
          <button onClick={handleSearchLocation} style={styles.searchButton}>
            Search
          </button>
        </div>
      </div>

      <div style={styles.currentLocationWrapper}>
        <button onClick={handleUseCurrentLocation} style={styles.currentLocationButton}>
          Use My Current Location
        </button>
      </div>

      {locationError ? <div style={styles.errorToast}>{locationError}</div> : null}
    </div>
  );
}