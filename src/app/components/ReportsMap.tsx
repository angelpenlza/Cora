"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const searchWrapperRef = useRef<HTMLDivElement | null>(null);

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
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    CATEGORY_OPTIONS.map((c) => c.id)
  );

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

      return true;
    });
  }, [reports, selectedCategories, statusFilters]);

  useEffect(() => {
    if (!googleMapsApiKey) return;

    const key = googleMapsApiKey;
    const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() || undefined;

    let markers: google.maps.marker.AdvancedMarkerElement[] = [];
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
      autocompleteServiceRef.current = new gmaps.maps.places.AutocompleteService();
      placesServiceRef.current = new gmaps.maps.places.PlacesService(map);
      infoWindow = new gmaps.maps.InfoWindow();
      hoverWindow = new gmaps.maps.InfoWindow();

      markers = filteredReports.map((r) => {
        const [lng, lat] = r.location_geojson!.coordinates;
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
        hoverWindow!.setContent(
          generateReportPopup(
            r,
            iconUrl,
            categoryToLabel(r.category_id),
            status,
            formatReportDate(r.created_at)
          )
        );
        hoverWindow!.open({ map, anchor: marker });
      };

      content.addEventListener("mouseenter", openHover);
      content.addEventListener("mouseleave", () => hoverWindow!.close());

      marker.addListener("click", () => {
        infoWindow!.setContent(
          generateReportPopup(
            r,
            iconUrl,
            categoryToLabel(r.category_id),
            status,
            formatReportDate(r.created_at)
          )
        );
        infoWindow!.open({ map, anchor: marker });
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
      markers.forEach((m) => {
        m.map = null;
      });
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
  function handleSearchInput(value: string) {
    setSearchQuery(value);

    const service = autocompleteServiceRef.current;
    if (!service || !value.trim()) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

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

      <div
        className={`filter-panel ${filtersOpen ? "filter-panel-open" : "filter-panel-closed"}`}
      >
        <button
          onClick={() => setFiltersOpen((prev) => !prev)}
          className="filter-header-button"
        >
          <span>Filters</span>
          <span className="filter-chevron">
            {filtersOpen ? "⌃" : "⌄"}
          </span>
        </button>

        {filtersOpen && (
          <div className="filter-body">
            <div className="filter-section">
              <div className="section-title">
                <span className="section-dot section-dot-timeframe" />
                Timeframe
              </div>

              <div className="option-grid">
                <label><input type="radio" name="timeframe" disabled /> Daily</label>
                <label><input type="radio" name="timeframe" disabled defaultChecked /> Weekly</label>
                <label><input type="radio" name="timeframe" disabled /> Monthly</label>
              </div>
            </div>

            <div className="filter-section">
              <div className="section-title">
                <span className="section-dot section-dot-status" />
                Report Status
              </div>

              <div className="option-grid">
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

            <div className="filter-section-last">
              <div className="section-title">
                <span className="section-dot section-dot-category" />
                Category
              </div>

              <div className="category-grid">
                {CATEGORY_OPTIONS.map((category) => (
                  <label
                    key={category.id}
                    className="category-label"
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

            <button onClick={resetAllFilters} className="reset-button">
              RESET ALL FILTERS
            </button>
          </div>
        )}
      </div>

      <div className="search-wrapper" ref={searchWrapperRef}>
        <div className="search-bar">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => {
              if (predictions.length > 0) setShowPredictions(true);
            }}
            placeholder="Search by location..."
            className="search-input"
          />
          <button onClick={handleSearchLocation} className="search-button">
            Search
          </button>
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
