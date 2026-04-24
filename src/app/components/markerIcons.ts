// src/app/components/markerIcons.ts

export const categoryIconMap: Record<number, string> = {
    1: "/icons/robbery.png",
    2: "/icons/traffic.png",
    3: "/icons/assault.png",
    4: "/icons/suspicious.png",
    5: "/icons/vandalism.png",
    6: "/icons/hazard.png",
    7: "/icons/other.png",
};

export function getCategoryIcon(categoryId: number | null | undefined): string {
    if (!categoryId) return "/icons/other.png";
    return categoryIconMap[categoryId] ?? "/icons/other.png";
}

export function createMarkerContent(iconUrl: string, color: string): HTMLDivElement {
    const wrapper = document.createElement("div");
    wrapper.className = "report-marker";

    wrapper.innerHTML = `
    <div class="report-marker-pin" style="background:${color}">
        <div class="report-marker-glyph">
        <img src="${iconUrl}" alt="" />
        </div>
    </div>
    `;

    return wrapper;
}