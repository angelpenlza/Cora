import type { CategoryOption } from "./mapTypes";

export const CATEGORY_OPTIONS = [
    { id: 1, label: "Robbery" },
    { id: 2, label: "Traffic" },
    { id: 3, label: "Assault" },
    { id: 4, label: "Suspicious" },
    { id: 5, label: "Vandalism" },
    { id: 6, label: "Hazard" },
    { id: 7, label: "Other" },
];

export function scoreToStatus(score: number | null) {
    if (score == null) return "unconfirmed";
    if (score >= 5) return "supported";
    if (score >= 0) return "unconfirmed";
    return "disputed";
}

export type MapStatusKey = "supported" | "unconfirmed" | "disputed";

/**
 * Prefer canonical status from the database (`reports_with_meta.status`), e.g.
 * `Community-Supported`, so the map matches the rest of the app. Falls back to
 * score-based rules when status is missing or unknown.
 */
export function resolveMapStatus(
    score: number | null,
    dbStatus: string | null | undefined
): MapStatusKey {
    if (dbStatus != null && String(dbStatus).trim() !== "") {
        const key = String(dbStatus)
            .toLowerCase()
            .trim()
            .replace(/[\s_]+/g, "-");
        if (key === "community-supported" || key === "supported") {
            return "supported";
        }
        if (key === "disputed") {
            return "disputed";
        }
        if (key === "unconfirmed") {
            return "unconfirmed";
        }
    }
    return scoreToStatus(score) as MapStatusKey;
}

export function statusToColor(status: string) {
    if (status === "supported") return "#0B6B3A";
    if (status === "disputed") return "#D97706";
    return "#FACC15";
}

export function categoryToIcon(categoryId: number | null) {
    if (categoryId === 1) return "/icons/robbery.png";
    if (categoryId === 2) return "/icons/traffic.png";
    if (categoryId === 3) return "/icons/assault.png";
    if (categoryId === 4) return "/icons/suspicious.png";
    if (categoryId === 5) return "/icons/vandalism.png";
    if (categoryId === 6) return "/icons/hazard.png";
    if (categoryId === 7) return "/icons/other.png";
    return "/icons/other.png";
}

export function categoryToLabel(categoryId: number | null) {
    return CATEGORY_OPTIONS.find((c) => c.id === categoryId)?.label ?? "Report";
}

export function formatReportDate(dateString: string | null) {
    if (!dateString) return "No date";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    });
}
function reportDetailHref(report: { report_id?: string | number | null }): string {
    const id = report?.report_id;
    if (id == null || id === "") return "#";
    return `/pages/reports/${encodeURIComponent(String(id))}`;
}

export function generateReportPopup(
    report: any,
    iconPath: string | null,
    categoryLabel: string,
    status: string,
    formattedDate: string
) {
    const detailHref = reportDetailHref(report);

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

    return `
    <div class="popup">
        <div class="popup-header">
        <div class="popup-icon-wrap">
            ${
            iconPath
                ? `<img src="${iconPath}" class="popup-icon" />`
                : ""
            }
        </div>

        <div class="popup-category">
            ${categoryLabel.toUpperCase()}
        </div>

        <div class="popup-header-actions">
        <div
            class="popup-badge"
            style="
            background:${badgeBg};
            color:${badgeColor};
            border:1px solid ${badgeColor}33;
            "
        >
            ● ${badgeText}
        </div>
        <button type="button" class="popup-close" aria-label="Close">&times;</button>
        </div>
        </div>

        <div class="popup-title">
        ${report.report_title ?? ""}
        </div>

        <div class="popup-description">
        ${report.report_description ?? ""}
        </div>

        <div class="popup-footer">
        <div class="popup-date">${formattedDate}</div>
        ${
            detailHref !== "#"
            ? `<a href="${detailHref}" class="popup-link">see more</a>`
            : `<span class="popup-link-disabled">see more</span>`
        }
        </div>
    </div>
    `;
}