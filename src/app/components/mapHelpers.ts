import type { CategoryOption } from "./mapTypes";

export const CATEGORY_OPTIONS: CategoryOption[] = [
    { id: 1, label: "Robbery" },
    { id: 4, label: "Traffic" },
    { id: 2, label: "Assault" },
];

export function scoreToStatus(score: number | null) {
    if (score == null) return "unconfirmed";
    if (score >= 5) return "supported";
    if (score >= 0) return "unconfirmed";
    return "disputed";
}

export function statusToColor(status: string) {
    if (status === "supported") return "#0B6B3A";
    if (status === "disputed") return "#D97706";
    return "#FACC15";
}

export function categoryToIcon(categoryId: number | null) {
    if (categoryId === 1) return "/icons/robbery.png";
    if (categoryId === 2) return "/icons/assault.png";
    if (categoryId === 4) return "/icons/traffic.png";
    return null;
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
export function generateReportPopup(
    report: any,
    iconPath: string | null,
    categoryLabel: string,
    status: string,
    formattedDate: string
) {
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
        ">
            ${
            iconPath
                ? `<img src="${iconPath}" style="width:18px;height:18px;" />`
                : ""
            }
        </div>

        <div style="
            font-weight:700;
            font-size:20px;
            letter-spacing:0.5px;
            color:#1E293B;
        ">
            ${categoryLabel.toUpperCase()}
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
        ${report.report_title ?? ""}
        </div>

        <div style="
        font-size:14px;
        line-height:1.45;
        color:#334155;
        margin-bottom:12px;
        ">
        ${report.report_description ?? ""}
        </div>

        <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        font-size:13px;
        color:#475569;
        ">
        <div>${formattedDate}</div>
        <div style="text-decoration:underline; cursor:pointer;">see more</div>
        </div>

    </div>
    `;
}