import type { CSSProperties } from "react";

export const styles: Record<string, CSSProperties> = {
    wrapper: {
        width: "100%",
        maxWidth: "1100px",
        margin: "24px auto",
        position: "relative",
    },

    map: {
        height: "600px",
        width: "100%",
        border: "none",
        borderRadius: "14px",
        overflow: "hidden",
    },

    filterPanel: {
        position: "absolute",
        top: "18px",
        left: "18px",
        background: "#CFE0EA",
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        zIndex: 10,
    },

    filterHeaderButton: {
        width: "100%",
        background: "#6F8F9F",
        color: "white",
        border: "none",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "18px",
        fontWeight: 700,
        cursor: "pointer",
    },

    filterBody: {
    padding: "18px 20px 16px 20px",
    },

    searchWrapper: {
        position: "absolute",
        top: "18px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        width: "360px",
        maxWidth: "calc(100% - 380px)",
    },

    searchBar: {
        display: "flex",
        alignItems: "center",
        background: "#D9E8F2",
        borderRadius: "12px",
        boxShadow: "0 8px 18px rgba(0,0,0,0.10)",
        overflow: "hidden",
    },

    searchInput: {
        flex: 1,
        border: "none",
        outline: "none",
        background: "transparent",
        padding: "14px 16px",
        fontSize: "15px",
    },

    searchButton: {
        border: "none",
        background: "transparent",
        padding: "0 16px",
        cursor: "pointer",
        fontWeight: 700,
        color: "#334155",
},

    currentLocationWrapper: {
        position: "absolute",
        top: "18px",
        right: "18px",
        zIndex: 10,
    },

    currentLocationButton: {
        padding: "12px 16px",
        borderRadius: "12px",
        border: "1px solid #D1D5DB",
        background: "white",
        cursor: "pointer",
        fontWeight: 700,
        boxShadow: "0 8px 18px rgba(0,0,0,0.10)",
    },

    errorToast: {
        position: "absolute",
        top: "76px",
        right: "18px",
        background: "white",
        padding: "10px 12px",
        borderRadius: "10px",
        fontSize: "14px",
        color: "#B91C1C",
        boxShadow: "0 8px 18px rgba(0,0,0,0.10)",
        zIndex: 10,
    },

    sectionTitle: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontWeight: 700,
        fontSize: "15px",
        marginBottom: "12px",
        color: "#243746",
    },

    optionGrid: {
        display: "grid",
        gap: "10px",
        paddingLeft: "14px",
        color: "#243746",
    },

    categoryGrid: {
        display: "grid",
        gap: "12px",
        paddingLeft: "14px",
        color: "#243746",
    },

    resetButton: {
        background: "transparent",
        border: "none",
        color: "#F97316",
        fontWeight: 700,
        letterSpacing: "0.04em",
        cursor: "pointer",
        padding: 0,
    },
};