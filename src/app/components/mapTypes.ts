export type Report = {
    report_id: string | number;
    created_at: string | null;
    report_title: string | null;
    report_description: string | null;
    report_image: string | null;
    category_id: number | null;
    upvotes: number | null;
    downvotes: number | null;
    score: number | null;
    location_geojson: { type: "Point"; coordinates: [number, number] } | null;
};

export type CategoryOption = {
    id: number;
    label: string;
};