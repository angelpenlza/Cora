"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Report } from "./mapTypes";
import { generateReportPopup } from "./mapHelpers";

import {
  CATEGORY_OPTIONS,
  categoryToIcon,
  categoryToLabel,
  formatReportDate,
  resolveMapStatus,
  statusToColor,
} from "./mapHelpers";
import { styles } from "./mapStyles";
import { ensureGoogleMapsReady } from "@/lib/googleMapsLoader";

const KNOWN_CATEGORY_IDS = new Set(CATEGORY_OPTIONS.map((c) => c.id));

type ReportsMapProps = {
  reports: Report[];
  fillViewport?: boolean;
};

export default function ReportsMap({
  reports,
  fillViewport = false,
}: ReportsMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const googleMapsApiKey = (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""
  ).trim();
  const mapsUnavailableMessage = googleMapsApiKey
    ? null
    : "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local and restart the dev server.";

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

  const wrapperStyle = useMemo((): CSSProperties => {
    if (!fillViewport) return styles.wrapper;
    return {
      ...styles.wrapper,
      flex: 1,
      minHeight: 0,
      width: "100%",
      maxWidth: "none",
      margin: 0,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    };
  }, [fillViewport]);

  const mapBlockStyle = useMemo((): CSSProperties => {
    if (!fillViewport) return styles.map;
    return {
      ...styles.map,
      flex: 1,
      minHeight: 0,
      height: "auto",
      borderRadius: 0,
    };
  }, [fillViewport]);

  const filteredReports = useMemo(() => {
    return (reports ?? []).filter((r) => {
      const coords = r.location_geojson?.coordinates;
      if (!coords || coords.length !== 2) return false;

      const [lng, lat] = coords;
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;

      if (
        r.category_id != null &&
        KNOWN_CATEGORY_IDS.has(r.category_id) &&
        !selectedCategories.includes(r.category_id)
      ) {
        return false;
      }

      const status = resolveMapStatus(r.score, r.status);
      if (status === "supported" && !statusFilters.supported) return false;
      if (status === "unconfirmed" && !statusFilters.unconfirmed) return false;
      if (status === "disputed" && !statusFilters.disputed) return false;

      return true;
    });
  }, [reports, selectedCategories, statusFilters]);

  useEffect(() => {
    if (!googleMapsApiKey) return;

    const key = googleMapsApiKey;
    const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() || undefined;

    let markers: google.maps.Marker[] = [];
    let clusterer: MarkerClusterer | null = null;
    let infoWindow: google.maps.InfoWindow | null = null;
    let hoverWindow: google.maps.InfoWindow | null = null;

    async function init() {
      await ensureGoogleMapsReady(key, mapId);
      if (!mapRef.current) return;

      const gmaps = (window as unknown as { google: typeof google }).google;

      const map = new gmaps.maps.Map(mapRef.current, {
        center: { lat: 33.7175, lng: -117.8311 },
        zoom: 10,
        ...(mapId ? { mapId } : {}),
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      mapInstanceRef.current = map;
      geocoderRef.current = new gmaps.maps.Geocoder();
      infoWindow = new gmaps.maps.InfoWindow();
      hoverWindow = new gmaps.maps.InfoWindow();

      markers = filteredReports.map((r) => {
        const [lng, lat] = r.location_geojson!.coordinates;
        const status = resolveMapStatus(r.score, r.status);
        const color = statusToColor(status);
        const iconPath = categoryToIcon(r.category_id);

        const marker = new gmaps.maps.Marker({
          map,
          position: { lat, lng },
          title: r.report_title ?? undefined,
          icon: {
            path: gmaps.maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 14,
          },
        });

        const openHover = () => {
          hoverWindow!.setContent(
            generateReportPopup(
              r,
              iconPath,
              categoryToLabel(r.category_id),
              status,
              formatReportDate(r.created_at)
            )
          );
          hoverWindow!.open({ map, anchor: marker, shouldFocus: false });
        };

        marker.addListener("mouseover", openHover);
        marker.addListener("mouseout", () => hoverWindow!.close());

        marker.addListener("click", () => {
          infoWindow!.setContent(
            generateReportPopup(
              r,
              iconPath,
              categoryToLabel(r.category_id),
              status,
              formatReportDate(r.created_at)
            )
          );
          infoWindow!.open({ map, anchor: marker, shouldFocus: false });
        });

        return marker;
      });

      clusterer = new MarkerClusterer({ map, markers });

      if (fillViewport) {
        const resize = () => gmaps.maps.event.trigger(map, 'resize');
        requestAnimationFrame(() => requestAnimationFrame(resize));
      }
    }

    init().catch(console.error);

    return () => {
      if (clusterer) clusterer.setMap(null);
      if (infoWindow) infoWindow.close();
      if (hoverWindow) hoverWindow.close();
      markers.forEach((m) => m.setMap(null));
      markers = [];
    };
  }, [filteredReports, googleMapsApiKey, fillViewport]);

  function handleUseCurrentLocation() {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const gmaps = (window as unknown as { google: typeof google }).google;
        const map = mapInstanceRef.current;
        if (!map || !gmaps) return;

        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        map.panTo(userPos);
        map.setZoom(14);

        if (userMarkerRef.current) {
          userMarkerRef.current.setMap(null);
        }

        userMarkerRef.current = new gmaps.maps.Marker({
          map,
          position: userPos,
          title: "Your current location",
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            scaledSize: new gmaps.maps.Size(42, 42),
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
    <div style={wrapperStyle}>
      {mapsUnavailableMessage ? (
        <div
          style={{
            ...mapBlockStyle,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#e5e5e5",
          }}
          role="status"
        >
          <p
            style={{
              padding: 24,
              textAlign: "center",
              maxWidth: 440,
              margin: 0,
              lineHeight: 1.5,
              color: "#333",
            }}
          >
            {mapsUnavailableMessage}
          </p>
        </div>
      ) : (
        <div ref={mapRef} style={mapBlockStyle} />
      )}

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
