"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Pill,
  Search,
  MapPin,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Info,
  Shuffle,
  Phone,
  Clock,
  Navigation,
  X,
  IndianRupee,
  Package,
  Factory,
  Beaker,
  ShieldAlert,
  Activity,
  ExternalLink,
} from "lucide-react";
import AddressSearch from "@/components/AddressSearch";

// ─── tiny helpers ────────────────────────────────────────────────────────────

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Badge({ children, variant = "default", className = "" }) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-sm font-medium";
  const variants = {
    default: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20",
    neutral: "bg-muted text-muted-foreground border border-border",
  };
  return (
    <span
      className={cn(base, variants[variant] ?? variants.default, className)}
    >
      {children}
    </span>
  );
}

function Spinner({ className = "" }) {
  return (
    <RefreshCw className={cn("animate-spin text-emerald-400", className)} />
  );
}

// ─── API helper ──────────────────────────────────────────────────────────────

async function apiGet(path, params = {}) {
  const sp = new URLSearchParams({ path, ...params });
  const res = await fetch(`/api/drug-lookup?${sp.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || err?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-emerald-400 shrink-0" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-emerald-900/10 last:border-0">
      <span className="text-sm text-muted-foreground w-32 shrink-0">
        {label}
      </span>
      <span className="text-sm text-foreground flex-1">{value}</span>
    </div>
  );
}

// ── Tab system ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "info", label: "Drug Info" },
  { id: "alternatives", label: "Alternatives" },
  { id: "safety", label: "Safety" },
  { id: "pharmacies", label: "Pharmacies" },
];

function TabBar({ active, onChange }) {
  return (
    <div className="flex border-b border-emerald-900/20 mb-4 overflow-x-auto">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
            active === t.id
              ? "text-emerald-400 border-b-2 border-emerald-400"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Drug Info Tab ─────────────────────────────────────────────────────────────

function DrugInfoTab({ data }) {
  const { indian_info, fda_info, rxnorm_info, composition } = data;

  return (
    <div className="space-y-4">
      {/* Indian DB record */}
      {indian_info && (
        <div className="rounded-xl border border-emerald-900/20 bg-muted/10 p-4">
          <SectionHeader icon={IndianRupee} title="Indian Brand Information" />
          <InfoRow label="Brand Name" value={indian_info.name} />
          <InfoRow label="Manufacturer" value={indian_info.manufacturer} />
          <InfoRow label="Pack Size" value={indian_info.pack_size} />
          <InfoRow
            label="Price"
            value={indian_info.price ? `₹${indian_info.price}` : null}
          />
          <InfoRow label="Type" value={indian_info.type} />
          {composition && (
            <div className="mt-2 pt-2 border-t border-emerald-900/10">
              <div className="flex items-center gap-2 mb-1">
                <Beaker className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-sm font-medium text-foreground">
                  Salt Composition
                </span>
              </div>
              <p className="text-sm text-emerald-400 bg-emerald-500/5 rounded-lg p-2 border border-emerald-500/10">
                {composition}
              </p>
            </div>
          )}
        </div>
      )}

      {/* FDA data */}
      {fda_info && (
        <div className="rounded-xl border border-emerald-900/20 bg-muted/10 p-4">
          <SectionHeader icon={Info} title="FDA Drug Information" />
          {fda_info.basic_info && (
            <>
              <InfoRow
                label="Generic Name"
                value={fda_info.basic_info.generic_name}
              />
              <InfoRow
                label="Drug Class"
                value={fda_info.basic_info.drug_class}
              />
              {fda_info.basic_info.brand_names?.length > 0 && (
                <InfoRow
                  label="Brand Names"
                  value={fda_info.basic_info.brand_names.slice(0, 6).join(", ")}
                />
              )}
              {fda_info.basic_info.description && (
                <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {fda_info.basic_info.description.slice(0, 400)}
                  {fda_info.basic_info.description.length > 400 && "…"}
                </div>
              )}
            </>
          )}
          {fda_info.dosage?.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium text-foreground mb-1">
                Dosage Forms
              </div>
              <div className="flex flex-wrap gap-1.5">
                {fda_info.dosage.slice(0, 5).map((d, i) => (
                  <Badge key={i}>{d.form || d.strength || d}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RxNorm */}
      {rxnorm_info && (
        <div className="rounded-xl border border-emerald-900/20 bg-muted/10 p-4">
          <SectionHeader icon={Activity} title="RxNorm Classification" />
          <InfoRow label="RxCUI" value={rxnorm_info.rxcui} />
          <InfoRow label="Term Type" value={rxnorm_info.tty} />
          <InfoRow label="Generic Name" value={rxnorm_info.generic_name} />
          {rxnorm_info.brand_names?.length > 0 && (
            <InfoRow
              label="Brand Names"
              value={rxnorm_info.brand_names.slice(0, 6).join(", ")}
            />
          )}
        </div>
      )}

      {!indian_info && !fda_info && (
        <div className="text-center text-muted-foreground py-8 text-sm">
          No drug information found.
        </div>
      )}
    </div>
  );
}

// ── Alternatives Tab ──────────────────────────────────────────────────────────

function AlternativesTab({ data }) {
  const { alternatives, rxnorm_info } = data;
  const hasAlternatives = alternatives?.length > 0;
  const hasBrands = rxnorm_info?.brand_names?.length > 0;

  return (
    <div className="space-y-4">
      {data.composition && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Beaker className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">
              Matched by Composition
            </span>
          </div>
          <p className="text-sm text-foreground">{data.composition}</p>
        </div>
      )}

      {hasAlternatives && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shuffle className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-foreground">
              Indian Generic Alternatives ({alternatives.length})
            </span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {alternatives.map((alt, i) => (
              <AlternativeCard key={i} drug={alt} />
            ))}
          </div>
        </div>
      )}

      {hasBrands && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Pill className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-foreground">
              RxNorm Brand Equivalents
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {rxnorm_info.brand_names.map((b, i) => (
              <Badge key={i} variant="neutral">
                {b}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {!hasAlternatives && !hasBrands && (
        <div className="text-center text-muted-foreground py-8 text-sm">
          No Alternatives Found. This May be a Unique Formulation.
        </div>
      )}
    </div>
  );
}

function AlternativeCard({ drug }) {
  return (
    <div className="rounded-lg border border-emerald-900/20 bg-muted/10 p-3 hover:border-emerald-500/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {drug.name}
          </p>
          {drug.manufacturer && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {drug.manufacturer}
            </p>
          )}
          {drug.composition1 && (
            <p className="text-sm text-emerald-400 mt-1">
              {drug.composition1}
              {drug.composition2 && ` + ${drug.composition2}`}
            </p>
          )}
          {drug.pack_size && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {drug.pack_size}
            </p>
          )}
        </div>
        {drug.price && (
          <div className="shrink-0 text-right">
            <span className="text-sm font-semibold text-emerald-400">
              ₹{drug.price}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Safety Tab ────────────────────────────────────────────────────────────────

function SafetyTab({ drugName, safetyData, loading, onLoad }) {
  useEffect(() => {
    if (!safetyData && !loading) {
      onLoad();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!safetyData) {
    return (
      <div className="text-center text-muted-foreground py-8 text-sm">
        Safety data unavailable.
      </div>
    );
  }

  const score = safetyData.safety_score ?? null;
  const scoreColor =
    score === null
      ? "text-muted-foreground"
      : score >= 7
        ? "text-red-400"
        : score >= 4
          ? "text-amber-400"
          : "text-emerald-400";

  return (
    <div className="space-y-4">
      {/* Safety score */}
      {score !== null && (
        <div className="rounded-xl border border-emerald-900/20 bg-muted/10 p-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm text-muted-foreground">Safety Score</p>
              <p className={cn("text-2xl font-bold", scoreColor)}>
                {score.toFixed(1)}/10
              </p>
              <p className="text-sm text-muted-foreground">
                (lower = fewer adverse event reports)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {safetyData.warnings?.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <SectionHeader icon={AlertTriangle} title="Warnings" />
          <ul className="space-y-1.5">
            {safetyData.warnings.slice(0, 8).map((w, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2">
                <span className="text-amber-400 shrink-0">•</span>
                {w.description || w.warning || w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Top adverse reactions */}
      {safetyData.top_reactions?.length > 0 && (
        <div className="rounded-xl border border-emerald-900/20 bg-muted/10 p-4">
          <SectionHeader icon={Activity} title="Top Reported Reactions" />
          <div className="flex flex-wrap gap-2">
            {safetyData.top_reactions.slice(0, 12).map((r, i) => (
              <Badge key={i} variant={i < 3 ? "warning" : "neutral"}>
                {r.reaction || r}
                {r.count ? ` (${r.count})` : ""}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recalls */}
      {safetyData.recall_count > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">
              {safetyData.recall_count} FDA Recall Record
              {safetyData.recall_count !== 1 ? "s" : ""} Found
            </span>
          </div>
        </div>
      )}

      {!safetyData.warnings?.length &&
        !safetyData.top_reactions?.length &&
        !safetyData.recall_count && (
          <div className="text-center text-muted-foreground py-8 text-sm">
            No Significant Safety Alerts Found in FDA Database.
          </div>
        )}
    </div>
  );
}

// ── Pharmacy Map ──────────────────────────────────────────────────────────────

const MAPTILER_KEY = "X8chXEtN8gGlWO2Km6HQ";

const POPUP_STYLES = `
  .pharmacy-popup .maplibregl-popup-content {
    padding: 0 !important;
    border-radius: 16px !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08) !important;
    overflow: hidden;
    border: 1px solid rgba(226,232,240,0.8);
  }
  .pharmacy-popup .maplibregl-popup-tip {
    border-top-color: white !important;
  }
  .user-popup .maplibregl-popup-content {
    padding: 6px 12px !important;
    border-radius: 20px !important;
    box-shadow: 0 4px 16px rgba(59,130,246,0.25) !important;
    background: white;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: #1e40af;
    border: 1.5px solid rgba(59,130,246,0.2);
  }
  .user-popup .maplibregl-popup-tip {
    border-top-color: white !important;
  }
  .popup-close-btn:hover { background: #e2e8f0 !important; }
`;

function PharmacyMap({ pharmacies, userLocation }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || !userLocation) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Inject popup styles once
    const styleId = "pharmacy-map-popup-styles";
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.textContent = POPUP_STYLES;
      document.head.appendChild(styleEl);
    }

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
      center: [userLocation.lon, userLocation.lat],
      zoom: 13,
    });

    // ── User location marker ──────────────────────────────────
    const userEl = document.createElement("div");
    userEl.innerHTML = `
      <div style="position:relative;width:22px;height:22px;">
        <div style="position:absolute;inset:0;background:rgba(59,130,246,0.25);border-radius:50%;animation:pulse 2s infinite;"></div>
        <div style="position:relative;width:22px;height:22px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.5);"></div>
      </div>
    `;
    new maplibregl.Marker({ element: userEl })
      .setLngLat([userLocation.lon, userLocation.lat])
      .setPopup(
        new maplibregl.Popup({
          offset: 14,
          closeButton: false,
          className: "user-popup",
        }).setHTML(`<span>📍 Your Location</span>`),
      )
      .addTo(mapRef.current);

    // ── Pharmacy markers ──────────────────────────────────────
    pharmacies.forEach((pharmacy) => {
      const lat = pharmacy.lat ?? pharmacy.latitude;
      const lon = pharmacy.lon ?? pharmacy.longitude;
      if (!lat || !lon) return;

      // Pin marker
      const el = document.createElement("div");
      el.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
          <div style="width:36px;height:36px;background:linear-gradient(135deg,#10b981,#059669);border:2.5px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(16,185,129,0.45);">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div style="width:2px;height:6px;background:linear-gradient(to bottom,#059669,transparent);margin-top:-1px;"></div>
        </div>
      `;

      const distKm = pharmacy.distance_m
        ? (pharmacy.distance_m / 1000).toFixed(1)
        : null;

      // Popup card DOM
      const popupContainer = document.createElement("div");
      popupContainer.style.cssText =
        "width:252px;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;";

      popupContainer.innerHTML = `
        <div style="
          padding:14px 14px 0 14px;
          display:flex;
          align-items:center;
          gap:8px;
        ">

          <!-- Name + Address column -->
          <div style="
            display:flex;
            flex-direction:column;
            gap:4px;
            min-width:0;
          ">
            <p style="
              font-size:13.5px;
              font-weight:700;
              color:#0f172a;
              margin:0;
              line-height:1.3;
            ">
              ${pharmacy.name}
            </p>

            ${
              pharmacy.address
                ? `
              <p style="
                font-size:11px;
                color:#94a3b8;
                margin:0;
                line-height:1.4;
              ">
                ${pharmacy.address}
              </p>
            `
                : ""
            }
        </div>

          <!-- Close button -->
          <button class="popup-close-btn" style="
            margin-left:auto;
            width:24px;
            height:24px;
            border-radius:50%;
            background:#f1f5f9;
            border:1px solid #e2e8f0;
            cursor:pointer;
            flex-shrink:0;
          ">
            ×
          </button>

          </div>

          <!-- Distance badge -->
          ${
            distKm
              ? `
          <div style="padding:10px 14px 0 14px;">
            <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px 4px 8px;background:linear-gradient(135deg,#d1fae5,#a7f3d0);border-radius:20px;font-size:11px;font-weight:700;color:#065f46;letter-spacing:0.02em;">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#065f46" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              ${distKm} km Away
            </span>
          </div>`
              : ""
          }

          <!-- Hours -->
          ${
            pharmacy.opening_hours
              ? `
          <div style="padding:8px 14px 0 14px;display:flex;align-items:center;gap:5px;">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style="font-size:11px;color:#64748b;">${pharmacy.opening_hours.slice(0, 38)}</span>
          </div>`
              : ""
          }

          <!-- Divider -->
          <div style="margin:12px 14px 0 14px;height:1px;background:linear-gradient(to right,#f1f5f9,#e2e8f0,#f1f5f9);"></div>

          <!-- Action buttons -->
          <div style="padding:10px 14px 14px 14px;display:flex;gap:8px;">
            ${
              pharmacy.phone
                ? `
            <a href="tel:${pharmacy.phone}" style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px 6px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:11.5px;font-weight:600;color:#475569;text-decoration:none;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 10.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 7.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Call
            </a>`
                : ""
            }
            ${
              pharmacy.maps_url
                ? `
            <a href="${pharmacy.maps_url}" target="_blank" rel="noopener noreferrer" style="flex:2;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px 6px;background:linear-gradient(135deg,#10b981,#059669);border-radius:10px;font-size:11.5px;font-weight:700;color:white;text-decoration:none;letter-spacing:0.01em;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              Directions
            </a>`
                : ""
            }
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: [0, -8],
        closeButton: false,
        maxWidth: "none",
        className: "pharmacy-popup",
      }).setDOMContent(popupContainer);

      // Wire close button to popup
      const closeBtn = popupContainer.querySelector(".popup-close-btn");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => popup.remove());
      }

      new maplibregl.Marker({ element: el })
        .setLngLat([parseFloat(lon), parseFloat(lat)])
        .setPopup(popup)
        .addTo(mapRef.current);
    });

    // Fit bounds to all markers
    const validPharmacies = pharmacies.filter(
      (p) => (p.lat ?? p.latitude) && (p.lon ?? p.longitude),
    );
    if (validPharmacies.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([userLocation.lon, userLocation.lat]);
      validPharmacies.forEach((p) => {
        bounds.extend([
          parseFloat(p.lon ?? p.longitude),
          parseFloat(p.lat ?? p.latitude),
        ]);
      });
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [pharmacies, userLocation]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-80 rounded-xl overflow-hidden border border-emerald-900/20"
    />
  );
}

// ── Pharmacies Tab ────────────────────────────────────────────────────────────

function PharmaciesTab({
  pharmacyData,
  loading,
  error,
  onLocate,
  userLocation,
  onAddressSearch,
}) {
  if (!pharmacyData && !loading && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="bg-emerald-500/10 rounded-full p-4">
          <MapPin className="h-8 w-8 text-emerald-400" />
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-2">
          Find Pharmacies Near You that Might Stock this Medication.
        </p>

        {/* Address Search */}
        <div className="w-full max-w-md mb-3">
          <AddressSearch
            onSelectAddress={onAddressSearch}
            placeholder="Search by Address (City, Street, Area...)"
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full max-w-md my-2">
          <div className="flex-1 h-px bg-emerald-900/20" />
          <span className="text-xs text-muted-foreground">OR</span>
          <div className="flex-1 h-px bg-emerald-900/20" />
        </div>

        {/* Use My Location Button */}
        <button
          onClick={onLocate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
        >
          <Navigation className="h-4 w-4" />
          Use My Current Location
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Spinner className="h-6 w-6" />
        <p className="text-sm text-muted-foreground">
          Searching Nearby Pharmacies…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
        <AlertTriangle className="h-5 w-5 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={onLocate}
          className="mt-3 text-sm text-emerald-400 hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  const pharmacies = pharmacyData?.pharmacies ?? [];

  return (
    <div className="space-y-3">
      {/* Location Info */}
      {userLocation?.address && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-start gap-2">
          <MapPin className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-400">
              Search Location
            </p>
            <p className="text-sm text-foreground mt-0.5">
              {userLocation.address}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {pharmacies.length === 0
            ? "No Pharmacies Found in This Area"
            : `${pharmacies.length} Pharmacies Found Within ${(
                (pharmacyData?.radius_m ?? 5000) / 1000
              ).toFixed(1)} km`}
        </span>
        <button
          onClick={onLocate}
          className="text-sm text-emerald-400 hover:underline flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      {userLocation && pharmacies.length > 0 && (
        <PharmacyMap pharmacies={pharmacies} userLocation={userLocation} />
      )}

      {pharmacies.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Try Increasing the Search Radius or Check a Different Location.
        </div>
      )}

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {pharmacies.map((p, i) => (
          <PharmacyCard key={i} pharmacy={p} />
        ))}
      </div>
    </div>
  );
}

function PharmacyCard({ pharmacy }) {
  const distKm = (pharmacy.distance_m / 1000).toFixed(2);

  return (
    <div className="rounded-lg border border-emerald-900/20 bg-muted/10 p-3 hover:border-emerald-500/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{pharmacy.name}</p>
          {pharmacy.address && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {pharmacy.address}
            </p>
          )}
          <div className="flex flex-wrap gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-sm text-emerald-400">
              <MapPin className="h-3 w-3" />
              {distKm} km
            </span>
            {pharmacy.phone && (
              <a
                href={`tel:${pharmacy.phone}`}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <Phone className="h-3 w-3" />
                {pharmacy.phone}
              </a>
            )}
            {pharmacy.opening_hours && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                {pharmacy.opening_hours.slice(0, 40)}
              </span>
            )}
          </div>
        </div>
        <a
          href={pharmacy.maps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded-lg px-2 py-1"
        >
          <ExternalLink className="h-3 w-3" />
          Map
        </a>
      </div>
    </div>
  );
}

// ── Search Results List ───────────────────────────────────────────────────────

function SearchResultItem({ drug, onSelect }) {
  return (
    <button
      onClick={() => onSelect(drug)}
      className="w-full text-left rounded-lg border border-emerald-900/20 bg-muted/10 p-3 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{drug.name}</p>
          {drug.manufacturer && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {drug.manufacturer}
            </p>
          )}
          {(drug.composition1 || drug.generic_name) && (
            <p className="text-sm text-emerald-400 mt-1 truncate">
              {drug.composition1 || drug.generic_name}
              {drug.composition2 && ` + ${drug.composition2}`}
            </p>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          {drug.price && (
            <span className="text-sm font-semibold text-emerald-400">
              ₹{drug.price}
            </span>
          )}
          <Badge variant="neutral">{drug.type || "FDA"}</Badge>
        </div>
      </div>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DrugLookupClient() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [drugDetail, setDrugDetail] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [safetyData, setSafetyData] = useState(null);
  const [pharmacyData, setPharmacyData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingSafety, setLoadingSafety] = useState(false);
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);
  const [pharmacyError, setPharmacyError] = useState(null);
  const [error, setError] = useState(null);

  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const suggestDebounceRef = useRef(null);

  // ── autocomplete ────────────────────────────────────────────────────────────

  const fetchSuggestions = useCallback(async (val) => {
    if (val.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const data = await apiGet("autocomplete", { q: val, limit: "8" });
      setSuggestions(data.suggestions || []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setShowSuggestions(true);

    clearTimeout(suggestDebounceRef.current);
    suggestDebounceRef.current = setTimeout(() => fetchSuggestions(val), 200);
  };

  // ── search ──────────────────────────────────────────────────────────────────

  const handleSearch = useCallback(
    async (searchQuery) => {
      const q = (searchQuery ?? query).trim();
      if (!q) return;

      setShowSuggestions(false);
      setLoadingSearch(true);
      setError(null);
      setSelectedDrug(null);
      setDrugDetail(null);
      setSafetyData(null);
      setPharmacyData(null);

      try {
        const data = await apiGet("search", { q, limit: "15" });
        setSearchResults(data);
      } catch (err) {
        setError(err.message);
        setSearchResults(null);
      } finally {
        setLoadingSearch(false);
      }
    },
    [query],
  );

  // ── select drug ─────────────────────────────────────────────────────────────

  const handleSelectDrug = useCallback(async (drug) => {
    setSelectedDrug(drug);
    setActiveTab("info");
    setSafetyData(null);
    setPharmacyData(null);
    setPharmacyError(null);
    setLoadingDetail(true);
    setError(null);

    try {
      const data = await apiGet(`info/${encodeURIComponent(drug.name)}`);
      setDrugDetail(data);
    } catch (err) {
      setError(err.message);
      setDrugDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // ── safety load ─────────────────────────────────────────────────────────────

  const loadSafety = useCallback(async () => {
    if (!selectedDrug || safetyData || loadingSafety) return;
    setLoadingSafety(true);
    try {
      const data = await apiGet(
        `safety/${encodeURIComponent(selectedDrug.name)}`,
      );
      setSafetyData(data);
    } catch {
      setSafetyData({ error: true });
    } finally {
      setLoadingSafety(false);
    }
  }, [selectedDrug, safetyData, loadingSafety]);

  // ── pharmacy locate ─────────────────────────────────────────────────────────

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setPharmacyError("Geolocation is not supported by your browser.");
      return;
    }
    setLoadingPharmacies(true);
    setPharmacyError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserLocation({ lat, lon });
        try {
          const data = await apiGet("pharmacies", {
            lat: String(lat),
            lon: String(lon),
            radius: "5000",
          });
          setPharmacyData(data);
        } catch (err) {
          setPharmacyError(err.message);
        } finally {
          setLoadingPharmacies(false);
        }
      },
      (err) => {
        setLoadingPharmacies(false);
        setPharmacyError(
          err.code === 1
            ? "Location access was denied. Please allow location access in your browser."
            : "Could not get your location. Please try again.",
        );
      },
      { timeout: 10_000 },
    );
  }, []);

  // ── pharmacy address search ─────────────────────────────────────────────────

  const handleAddressSearch = useCallback(async (location) => {
    setLoadingPharmacies(true);
    setPharmacyError(null);
    setUserLocation({
      lat: location.lat,
      lon: location.lon,
      address: location.address,
    });

    try {
      const data = await apiGet("pharmacies", {
        lat: String(location.lat),
        lon: String(location.lon),
        radius: "5000",
      });
      setPharmacyData(data);
    } catch (err) {
      setPharmacyError(err.message);
    } finally {
      setLoadingPharmacies(false);
    }
  }, []);

  // ── keyboard handling ───────────────────────────────────────────────────────

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") setShowSuggestions(false);
  };

  // Dismiss suggestions when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── render ──────────────────────────────────────────────────────────────────

  const allIndianResults = searchResults?.indian_results ?? [];
  const allFdaResults = searchResults?.fda_results ?? [];
  const hasResults = allIndianResults.length > 0 || allFdaResults.length > 0;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Pill className="h-8 w-8 text-emerald-400" />
          Drug Lookup
        </h1>
        <p className="text-muted-foreground text-sm">
          Search 250,000+ Indian Medicines and the FDA Database. Find Generic
          Alternatives, Safety Data, and Nearby Pharmacies.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-6" ref={searchRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search by Drug Name, Salt (e.g. Dolo 650, Paracetamol, Augmentin)…"
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-emerald-900/30 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                  setSearchResults(null);
                  setSelectedDrug(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loadingSearch || !query.trim()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {loadingSearch ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>

        {/* Autocomplete dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-xl border border-emerald-900/20 bg-background shadow-lg overflow-hidden">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery(s);
                  setShowSuggestions(false);
                  handleSearch(s);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-emerald-500/5 hover:text-emerald-400 transition-colors flex items-center gap-2"
              >
                <Pill className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left panel: search results ── */}
        <div className="lg:col-span-2">
          {!hasResults && !loadingSearch && (
            <div className="rounded-xl border border-emerald-900/20 bg-muted/5 p-6">
              <div className="text-center">
                <div className="bg-emerald-500/10 rounded-full p-4 inline-block mb-3">
                  <Search className="h-7 w-7 text-emerald-400" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Search for Any Drug, Salt, or Brand Name Above.
                </p>
                <div className="text-left space-y-1.5">
                  {[
                    "Dolo 650",
                    "Paracetamol",
                    "Augmentin 625",
                    "Amoxycillin",
                    "Ibuprofen",
                  ].map((ex) => (
                    <button
                      key={ex}
                      onClick={() => {
                        setQuery(ex);
                        handleSearch(ex);
                      }}
                      className="w-full text-left text-sm text-emerald-400 hover:text-emerald-300 py-1.5 px-3 rounded-lg hover:bg-emerald-500/5 transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="h-3 w-3" />
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {loadingSearch && (
            <div className="flex items-center justify-center py-20">
              <Spinner className="h-7 w-7" />
            </div>
          )}

          {hasResults && !loadingSearch && (
            <div className="space-y-4">
              {allIndianResults.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Indian Medicines ({allIndianResults.length})
                  </h2>
                  <div className="space-y-2">
                    {allIndianResults.map((d, i) => (
                      <SearchResultItem
                        key={i}
                        drug={d}
                        onSelect={handleSelectDrug}
                      />
                    ))}
                  </div>
                </div>
              )}

              {allFdaResults.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    FDA Database ({allFdaResults.length})
                  </h2>
                  <div className="space-y-2">
                    {allFdaResults.map((d, i) => (
                      <SearchResultItem
                        key={i}
                        drug={{
                          ...d,
                          name: d.name || d.generic_name || "Unknown",
                        }}
                        onSelect={() =>
                          handleSelectDrug({
                            name: d.name || d.generic_name || query,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right panel: drug detail ── */}
        <div className="lg:col-span-3">
          {!selectedDrug && (
            <div className="rounded-xl border border-emerald-900/20 bg-muted/5 p-8 text-center h-full flex flex-col items-center justify-center gap-3">
              <div className="bg-emerald-500/10 rounded-full p-5">
                <Pill className="h-10 w-10 text-emerald-400" />
              </div>
              <p className="text-sm text-muted-foreground">
                Select a Drug from the Results to View Detailed Information.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                <Badge variant="default">Drug Info</Badge>
                <Badge variant="default">Generic Alternatives</Badge>
                <Badge variant="default">Safety Data</Badge>
                <Badge variant="default">Nearby Pharmacies</Badge>
              </div>
            </div>
          )}

          {selectedDrug && (
            <div className="rounded-xl border border-emerald-900/20 bg-muted/5 overflow-hidden">
              {/* Drug detail header */}
              <div className="bg-emerald-500/5 border-b border-emerald-900/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-foreground">
                      {selectedDrug.name}
                    </h2>
                    {selectedDrug.manufacturer && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {selectedDrug.manufacturer}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedDrug.price && (
                        <Badge>₹{selectedDrug.price}</Badge>
                      )}
                      {selectedDrug.type && (
                        <Badge variant="neutral">{selectedDrug.type}</Badge>
                      )}
                      {selectedDrug.pack_size && (
                        <Badge variant="neutral">
                          <Package className="h-3 w-3 mr-1" />
                          {selectedDrug.pack_size}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDrug(null);
                      setDrugDetail(null);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Loading detail */}
              {loadingDetail && (
                <div className="flex items-center justify-center py-16">
                  <Spinner className="h-6 w-6" />
                </div>
              )}

              {/* Tabs */}
              {!loadingDetail && (
                <div className="p-4">
                  <TabBar active={activeTab} onChange={setActiveTab} />

                  {activeTab === "info" && drugDetail && (
                    <DrugInfoTab data={drugDetail} />
                  )}

                  {activeTab === "alternatives" && drugDetail && (
                    <AlternativesTab data={drugDetail} />
                  )}

                  {activeTab === "safety" && (
                    <SafetyTab
                      drugName={selectedDrug.name}
                      safetyData={safetyData}
                      loading={loadingSafety}
                      onLoad={loadSafety}
                    />
                  )}

                  {activeTab === "pharmacies" && (
                    <PharmaciesTab
                      pharmacyData={pharmacyData}
                      loading={loadingPharmacies}
                      error={pharmacyError}
                      onLocate={handleLocate}
                      onAddressSearch={handleAddressSearch}
                      userLocation={userLocation}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
