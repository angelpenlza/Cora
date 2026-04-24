"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import NextImage from "next/image";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Report } from "./mapTypes";
import { generateReportPopup } from "./mapHelpers";
import "../styles/map.css"; //! new 
import { getCategoryIcon, createMarkerContent } from "./markerIcons";;

import {
  CATEGORY_OPTIONS,
  categoryToIcon,
  categoryToLabel,
  formatReportDate,
  resolveMapStatus,
  statusToColor,
} from "./mapHelpers";
import { ensureGoogleMapsReady } from "@/lib/googleMapsLoader";

const KNOWN_CATEGORY_IDS = new Set(CATEGORY_OPTIONS.map((c) => c.id));

const categorySidebarIconMapById: Record<number, string> = {
  1: "/icons/robbery.png",
  2: "/icons/traffic.png",
  3: "/icons/assault.png",
  4: "/icons/suspicious.png",
  5: "/icons/vandalism.png",
  6: "/icons/hazard.png",
  7: "/icons/other.png",
};

type ReportsMapProps = {
  reports: Report[];
  fillViewport?: boolean;
};

type GoogleMapsWindow = { google: typeof google };

export default function ReportsMap({
  reports,
  fillViewport = false,
}: ReportsMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const searchWrapperRef = useRef<HTMLDivElement | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const hoverWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const markerUpdateTokenRef = useRef(0);
  const predictionsDebounceRef = useRef<number | null>(null);

  const googleMapsApiKey = (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""
  ).trim();
  const mapsUnavailableMessage = googleMapsApiKey
    ? null
    : "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local and restart the dev server.";

  const [locationError, setLocationError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"daily" | "weekly" | "monthly">("weekly");

  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    CATEGORY_OPTIONS.map((c) => c.id)
  );

  const [mapReady, setMapReady] = useState(false);
  const [statusFilters, setStatusFilters] = useState({
    supported: true,
    unconfirmed: true,
    disputed: true,
  });

//! this is where wrapperStyle and mapBlockStyle were 

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

      if (!r.created_at) return false;

      const createdAt = new Date(r.created_at);
      const now = new Date();

      const diffMs = now.getTime() - createdAt.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (timeFilter === "daily" && diffDays > 1) return false;
      if (timeFilter === "weekly" && diffDays > 7) return false;
      if (timeFilter === "monthly" && diffDays > 30) return false;

      return true;
    });
  }, [reports, selectedCategories, statusFilters, timeFilter]);

  useEffect(() => {
    if (!googleMapsApiKey) return;

    const key = googleMapsApiKey;
    const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() || undefined;

    function handlePopupCloseClick(e: MouseEvent) {
      const t = e.target as HTMLElement | null;
      if (!t?.closest(".popup-close")) return;
      e.preventDefault();
      e.stopPropagation();
      infoWindowRef.current?.close();
      hoverWindowRef.current?.close();
    }

    async function init() {
      await ensureGoogleMapsReady(key, mapId);
      if (!mapRef.current) return;

      const gmaps = (window as unknown as GoogleMapsWindow).google;

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
      autocompleteServiceRef.current = new gmaps.maps.places.AutocompleteService();
      placesServiceRef.current = new gmaps.maps.places.PlacesService(map);
      infoWindowRef.current = new gmaps.maps.InfoWindow({ headerDisabled: true });
      hoverWindowRef.current = new gmaps.maps.InfoWindow({ headerDisabled: true });
      map.getDiv().addEventListener("click", handlePopupCloseClick);
      clustererRef.current = new MarkerClusterer({ map, markers: [] });

      if (fillViewport) {
        const resize = () => gmaps.maps.event.trigger(map, 'resize');
        requestAnimationFrame(() => requestAnimationFrame(resize));
      }

      setMapReady(true);
    }

    init().catch(console.error);

    return () => {
      mapRef.current?.removeEventListener("click", handlePopupCloseClick);
      markerUpdateTokenRef.current += 1;
      clustererRef.current?.setMap(null);
      clustererRef.current = null;
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
      hoverWindowRef.current?.close();
      hoverWindowRef.current = null;
      markersRef.current.forEach((m) => {
        m.map = null;
      });
      markersRef.current = [];
      setMapReady(false);
    };
  }, [googleMapsApiKey, fillViewport]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapInstanceRef.current;
    const clusterer = clustererRef.current;
    if (!map || !clusterer) return;

    const gmaps = (window as unknown as GoogleMapsWindow).google;

    // Invalidate any in-flight marker rebuild and batch marker creation
    const token = (markerUpdateTokenRef.current += 1);

    // Clear existing markers quickly.
    infoWindowRef.current?.close();
    hoverWindowRef.current?.close();
    clusterer.clearMarkers();
    markersRef.current.forEach((m) => {
      m.map = null;
    });
    markersRef.current = [];

    const reportsToRender = filteredReports.slice();
    const CHUNK_SIZE = 250;
    let idx = 0;

    const buildChunk = () => {
      if (markerUpdateTokenRef.current !== token) return; // cancelled
      const end = Math.min(idx + CHUNK_SIZE, reportsToRender.length);
      const nextMarkers: google.maps.marker.AdvancedMarkerElement[] = [];

      for (; idx < end; idx += 1) {
        const r = reportsToRender[idx];
        const coords = r.location_geojson?.coordinates;
        if (!coords || coords.length !== 2) continue;
        const [lng, lat] = coords;
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;

        const status = resolveMapStatus(r.score, r.status);
        const color = statusToColor(status);
        const iconUrl = getCategoryIcon(r.category_id);
        const content = createMarkerContent(iconUrl, color);

        const marker = new gmaps.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat, lng },
          title: r.report_title ?? undefined,
          content,
        });

        const openHover = () => {
          const hoverWindow = hoverWindowRef.current;
          if (!hoverWindow) return;
          hoverWindow.setContent(
            generateReportPopup(
              r,
              iconUrl,
              categoryToLabel(r.category_id),
              status,
              formatReportDate(r.created_at)
            )
          );
          hoverWindow.open({ map, anchor: marker });
        };

        content.addEventListener("mouseenter", openHover);
        content.addEventListener("mouseleave", () => hoverWindowRef.current?.close());

        marker.addListener("click", () => {
          const infoWindow = infoWindowRef.current;
          if (!infoWindow) return;
          infoWindow.setContent(
            generateReportPopup(
              r,
              iconUrl,
              categoryToLabel(r.category_id),
              status,
              formatReportDate(r.created_at)
            )
          );
          infoWindow.open({ map, anchor: marker });
        });

        nextMarkers.push(marker);
      }

      if (markerUpdateTokenRef.current !== token) {
        nextMarkers.forEach((m) => {
          m.map = null;
        });
        return;
      }

      markersRef.current.push(...nextMarkers);
      clusterer.addMarkers(nextMarkers, false);

      if (idx < reportsToRender.length) {
        requestAnimationFrame(buildChunk);
      } else {
        clusterer.render();
      }
    };

    requestAnimationFrame(buildChunk);
  }, [filteredReports, mapReady]);

  function handleUseCurrentLocation() {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const gmaps = (window as unknown as GoogleMapsWindow).google;
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
    setTimeFilter("weekly");
  }
  function handleSearchInput(value: string) {
    setSearchQuery(value);

    const service = autocompleteServiceRef.current;
    if (!service || !value.trim()) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    if (predictionsDebounceRef.current != null) {
      window.clearTimeout(predictionsDebounceRef.current);
    }
    predictionsDebounceRef.current = window.setTimeout(() => {
      service.getPlacePredictions(
        {
          input: value,
          componentRestrictions: { country: "us" },
        },
        (results) => {
          const matches = results ?? [];
          setPredictions(matches);
          setShowPredictions(matches.length > 0);
        }
      );
    }, 180);
  }

  function handlePredictionSelect(prediction: google.maps.places.AutocompletePrediction) {
    const placesService = placesServiceRef.current;
    const map = mapInstanceRef.current;

    if (!placesService || !map) return;

    placesService.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["geometry", "formatted_address", "name"],
      },
      (place, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place?.geometry?.location
        ) {
          map.panTo(place.geometry.location);
          map.setZoom(14);

          setSearchQuery(prediction.description);
          setPredictions([]);
          setShowPredictions(false);
        }
      }
    );
  }
  useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      searchWrapperRef.current &&
      !searchWrapperRef.current.contains(event.target as Node)
    ) {
      setShowPredictions(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  return (
    <div className={`reports-map-wrapper ${fillViewport ? "fill-viewport" : ""}`}>
      {mapsUnavailableMessage ? (
        <div
          className={`reports-map-canvas reports-map-unavailable ${fillViewport ? "fill-viewport" : ""}`}
          role="status"
        >
          <p className="reports-map-unavailable-message">
            {mapsUnavailableMessage}
          </p>
        </div>
      ) : (
        <div ref={mapRef} className={`reports-map-canvas ${fillViewport ? "fill-viewport" : ""}`} />
      )}

      <div className={`filter-sidebar ${filtersOpen ? "open" : "closed"}`}>
        <button
          onClick={() => setFiltersOpen((prev) => !prev)}
          className="filter-toggle-tab"
          type="button"
        >
          <span>Filters</span>
          <span className="filter-chevron">
            {filtersOpen ? "‹" : "›"}
          </span>
        </button>

        <div className="filter-sidebar-content">
          <div className="filter-sidebar-header">Map Filters</div>

          <div className="filter-section">
            <div className="section-title">
              <span className="section-dot section-dot-timeframe" />
              Report Timeline
            </div>

            <div className="option-grid">
              <button
                type="button"
                className={`filter-chip ${timeFilter === "weekly" ? "selected" : ""}`}
                onClick={() => setTimeFilter("weekly")}
              >
                <NextImage src="/icons/timeline.png" alt="" width={18} height={18} className="filter-row-icon" />
                <span>Today</span>
              </button>

              <button
                type="button"
                className={`filter-chip ${timeFilter === "daily" ? "selected" : ""}`}
                onClick={() => setTimeFilter("daily")}
              >
                <NextImage src="/icons/timeline.png" alt="" width={18} height={18} className="filter-row-icon" />
                <span>Past Week</span>
              </button>

              <button
                type="button"
                className={`filter-chip ${timeFilter === "monthly" ? "selected" : ""}`}
                onClick={() => setTimeFilter("monthly")}
              >
                <NextImage src="/icons/timeline.png" alt="" width={18} height={18} className="filter-row-icon" />
                <span>Past Month</span>
              </button>
            </div>
          </div>

          <div className="filter-section">
            <div className="section-title">
              <span className="section-dot section-dot-status" />
              Report Status
            </div>

            <div className="option-grid">
              <button
                type="button"
                className={`filter-chip ${statusFilters.supported ? "selected" : ""}`}
                onClick={() => toggleStatus("supported")}
              >
                <NextImage src="/icons/communitySupported.png" alt="" width={18} height={18} className="filter-row-icon" />
                <span>Supported</span>
              </button>

              <button
                type="button"
                className={`filter-chip ${statusFilters.unconfirmed ? "selected" : ""}`}
                onClick={() => toggleStatus("unconfirmed")}
              >
                <NextImage src="/icons/unconfirmed.png" alt="" width={18} height={18} className="filter-row-icon" />
                <span>Unconfirmed</span>
              </button>

              <button
                type="button"
                className={`filter-chip ${statusFilters.disputed ? "selected" : ""}`}
                onClick={() => toggleStatus("disputed")}
              >
                <NextImage src="/icons/disputed.png" alt="" width={18} height={18} className="filter-row-icon" />
                <span>Disputed</span>
              </button>
            </div>
          </div>

          <div className="filter-section filter-section-last">
            <div className="section-title">
              <span className="section-dot section-dot-category" />
              Report Category
            </div>

            <div className="category-grid">
              {CATEGORY_OPTIONS.map((category) => {
                const isSelected = selectedCategories.includes(category.id);

                return (
                  <button
                    key={category.id}
                    type="button"
                    className={`filter-chip ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <NextImage
                      src={categorySidebarIconMapById[category.id] ?? "/icons/other.png"}
                      alt=""
                      width={18}
                      height={18}
                      className="filter-row-icon"
                    />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={resetAllFilters} className="reset-button">
            Reset All Filters
          </button>
        </div>
      </div>

      <div className="search-wrapper" ref={searchWrapperRef}>
        <div className="search-bar">
          <div className="search-inner">
            <button
              type="button"
              className="search-icon-button"
              onClick={handleSearchLocation}
              aria-label="Search"
            >
              <NextImage
                src="/assets/search-magnifying-glass.png"
                alt=""
                width={20}
                height={20}
                className="search-icon"
              />
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => {
                if (predictions.length > 0) setShowPredictions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchLocation();
                }
              }}
              placeholder="Search by location..."
              className="search-input"
            />
          </div>
        </div>
        
        {showPredictions && predictions.length > 0 && (
          <div className="search-predictions">
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                className="search-prediction-item"
                onClick={() => handlePredictionSelect(prediction)}
              >
                {prediction.description}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="current-location-wrapper">
        <button onClick={handleUseCurrentLocation} className="current-location-button">
          Use My Current Location
        </button>
      </div>

      {locationError ? <div className="error-toast">{locationError}</div> : null}
    </div>
  );
}
