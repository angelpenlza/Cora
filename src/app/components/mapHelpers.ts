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