
import {
    createBuildingRow,
    disposeBuildingRow
} from "../buildings.js";

// ============================================
// MASHWAR - CAIRO CITY
// صفوف مباني القاهرة على جانبي الطريق
// ============================================

const CAIRO_CONFIG = {
    firstPhase: 0,
    lastPhase: 3,

    roadEdge: 17.7,

    buildingCount: 14,
    startZ: -82,

    spacing: 1.8,

    leftSeed: 20261,
    rightSeed: 20262
};

// تحديد قطع الطريق التابعة للقاهرة
export function isCairoChunk(index) {
    const phase = ((index % 16) + 16) % 16;

    return (
        phase >= CAIRO_CONFIG.firstPhase &&
        phase <= CAIRO_CONFIG.lastPhase
    );
}

// إنشاء مباني القاهرة داخل قطعة الطريق
export function createCairoBuildings(chunk, index) {
    if (!chunk) {
        throw new Error("Cairo: chunk is required");
    }

    if (!isCairoChunk(index)) {
        return null;
    }

    // منع إنشاء المباني مرتين لنفس القطعة
    if (chunk.userData.cairoBuildingsCreated) {
        return chunk.userData.cairoBuildings || null;
    }

    const buildings = [];

    try {
        // صف المباني على الجانب الأيمن
        const rightRow = createBuildingRow(chunk, {
            side: 1,
            startZ: CAIRO_CONFIG.startZ,
            count: CAIRO_CONFIG.buildingCount,
            roadEdge: CAIRO_CONFIG.roadEdge,
            spacing: CAIRO_CONFIG.spacing,
            seed: CAIRO_CONFIG.rightSeed + index
        });

        buildings.push(rightRow);

        // صف المباني على الجانب الأيسر
        const leftRow = createBuildingRow(chunk, {
            side: -1,
            startZ: CAIRO_CONFIG.startZ,
            count: CAIRO_CONFIG.buildingCount,
            roadEdge: CAIRO_CONFIG.roadEdge,
            spacing: CAIRO_CONFIG.spacing,
            seed: CAIRO_CONFIG.leftSeed + index
        });

        buildings.push(leftRow);

        chunk.userData.cairoBuildings = buildings;
        chunk.userData.cairoBuildingsCreated = true;

        return buildings;

    } catch (error) {
        console.error(
            "MASHWAR: Failed to create Cairo buildings:",
            error
        );

        throw error;
    }
}

// إزالة صفوف المباني عند إعادة تدوير قطعة الطريق
export function removeCairoBuildings(chunk) {
    if (!chunk) return;

    const buildings = chunk.userData.cairoBuildings;

    if (buildings) {
        for (const row of buildings) {
            if (row) {
                row.removeFromParent();
            }
        }
    }

    delete chunk.userData.cairoBuildings;
    delete chunk.userData.cairoBuildingsCreated;
}
