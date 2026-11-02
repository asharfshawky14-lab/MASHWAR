
import * as THREE from "three";

// =====================================================
// MASHWAR - BENI SUEF
// واجهات بيوت مصرية متلاصقة على جانبي الطريق
// أول وآخر بيت كاملان، والبيوت الوسطى بعمق بسيط
// =====================================================

const CONFIG = {
    roadEdge: 18,
    buildingLine: 24,
    rowStart: -87,
    rowEnd: 87,
    minWidth: 9,
    maxWidth: 14,
    minFloors: 2,
    maxFloors: 4,
    fullDepth: 8,
    facadeDepth: 0.85
};

const COLORS = {
    plaster: [
        0xc9b99f,
        0xd5c7b1,
        0xbca98e,
        0xd8d0c1,
        0xc3b49e,
        0xb8aa97
    ],
    concrete: 0xaaa397,
    balcony: 0x77736d,
    metal: 0x45494a,
    glass: 0x526b73,
    darkGlass: 0x293b40,
    brick: 0x985b43,
    roof: 0xb9aa91,
    shop: 0x31545a,
    door: 0x514337,
    shadow: 0x786f61
};

const materials = {};

function material(name, color, options = {}) {
    const key = name + "_" + color;

    if (!materials[key]) {
        materials[key] = new THREE.MeshStandardMaterial({
            color,
            roughness: options.roughness ?? 0.9,
            metalness: options.metalness ?? 0
        });
    }

    return materials[key];
}

const MAT = {
    concrete: material("concrete", COLORS.concrete),
    balcony: material("balcony", COLORS.balcony),
    metal: material("metal", COLORS.metal, {
        metalness: 0.35
    }),
    glass: material("glass", COLORS.glass, {
        roughness: 0.38
    }),
    darkGlass: material("darkGlass", COLORS.darkGlass),
    brick: material("brick", COLORS.brick),
    roof: material("roof", COLORS.roof),
    shop: material("shop", COLORS.shop),
    door: material("door", COLORS.door),
    shadow: material("shadow", COLORS.shadow)
};

const geometryCache = new Map();

function boxGeometry(w, h, d) {
    const key = `${w.toFixed(2)}_${h.toFixed(2)}_${d.toFixed(2)}`;

    if (!geometryCache.has(key)) {
        geometryCache.set(
            key,
            new THREE.BoxGeometry(w, h, d)
        );
    }

    return geometryCache.get(key);
}

function seededRandom(seed) {
    let value = seed >>> 0;

    return function () {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 4294967296;
    };
}

function randomRange(random, min, max) {
    return min + random() * (max - min);
}

function randomInt(random, min, max) {
    return Math.floor(randomRange(random, min, max + 1));
}

function addBox(
    parent,
    x,
    y,
    z,
    width,
    height,
    depth,
    mat
) {
    const mesh = new THREE.Mesh(
        boxGeometry(width, height, depth),
        mat
    );

    mesh.position.set(
        x,
        y + height / 2,
        z
    );

    mesh.castShadow = false;
    mesh.receiveShadow = false;

    parent.add(mesh);

    return mesh;
}

function createFacadeMaterial(random) {
    const colors = COLORS.plaster;
    const color = colors[Math.floor(random() * colors.length)];

    return material("plaster", color);
}

// -----------------------------------------------------
// شبابيك ألوميتال واقعية مبسطة
// -----------------------------------------------------

function createWindow(parent, x, y, z, side, random) {
    const width = randomRange(random, 1.05, 1.45);
    const height = randomRange(random, 1.15, 1.55);

    addBox(
        parent,
        x,
        y,
        z,
        0.10,
        height + 0.24,
        width + 0.24,
        MAT.concrete
    );

    addBox(
        parent,
        x - side * 0.07,
        y + 0.08,
        z,
        0.045,
        height,
        width,
        MAT.darkGlass
    );

    // إطار ألوميتال
    const frame = MAT.metal;

    addBox(
        parent,
        x - side * 0.11,
        y + height / 2 + 0.08,
        z,
        0.045,
        0.055,
        width,
        frame
    );

    addBox(
        parent,
        x - side * 0.11,
        y - height / 2 + 0.08,
        z,
        0.045,
        0.055,
        width,
        frame
    );

    addBox(
        parent,
        x - side * 0.11,
        y + 0.08,
        z,
        0.045,
        height,
        0.055,
        frame
    );

    addBox(
        parent,
        x - side * 0.11,
        y + 0.08,
        z + width / 2 - 0.03,
        0.045,
        height,
        0.055,
        frame
    );

    // فاصل منتصف الشباك
    addBox(
        parent,
        x - side * 0.13,
        y + 0.08,
        z,
        0.035,
        height,
        0.035,
        MAT.metal
    );
}

// -----------------------------------------------------
// بلكونة خرسانية ودرابزين حديد
// -----------------------------------------------------

function createBalcony(parent, x, y, z, width, side) {
    addBox(
        parent,
        x - side * 0.65,
        y,
        z,
        1.35,
        0.16,
        width + 0.55,
        MAT.concrete
    );

    addBox(
        parent,
        x - side * 1.18,
        y + 0.48,
        z - width / 2 + 0.12,
        0.09,
        0.9,
        0.09,
        MAT.metal
    );

    addBox(
        parent,
        x - side * 1.18,
        y + 0.48,
        z + width / 2 - 0.12,
        0.09,
        0.9,
        0.09,
        MAT.metal
    );

    addBox(
        parent,
        x - side * 1.18,
        y + 0.86,
        z,
        0.09,
        0.09,
        width,
        MAT.metal
    );

    // قضبان الدرابزين
    const count = Math.max(4, Math.floor(width / 1.15));

    for (let i = 0; i < count; i++) {
        const offset =
            -width / 2 + (i / (count - 1)) * width;

        addBox(
            parent,
            x - side * 1.18,
            y + 0.35,
            z + offset,
            0.055,
            0.65,
            0.055,
            MAT.metal
        );
    }
}

// -----------------------------------------------------
// باب حديد أو باب محل
// -----------------------------------------------------

function createDoor(parent, x, y, z, side, random) {
    const width = randomRange(random, 1.05, 1.45);
    const height = 2.3;

    addBox(
        parent,
        x,
        y + height / 2,
        z,
        0.12,
        height + 0.18,
        width + 0.2,
        MAT.concrete
    );

    addBox(
        parent,
        x - side * 0.08,
        y + height / 2,
        z,
        0.05,
        height,
        width,
        random() > 0.45 ? MAT.door : MAT.shop
    );

    // تقسيمات الباب
    for (let i = 0; i < 3; i++) {
        addBox(
            parent,
            x - side * 0.12,
            y + 0.55 + i * 0.58,
            z,
            0.035,
            0.045,
            width - 0.15,
            MAT.metal
        );
    }
}

// -----------------------------------------------------
// خزان مياه فوق بعض البيوت
// -----------------------------------------------------

function createRoofDetails(parent, x, height, z, side, random) {
    if (random() < 0.55) {
        addBox(
            parent,
            x,
            height,
            z,
            2.2,
            0.45,
            2.2,
            MAT.concrete
        );

        const tank = new THREE.Mesh(
            new THREE.CylinderGeometry(0.65, 0.72, 1.35, 12),
            MAT.metal
        );

        tank.position.set(
            x - side * 0.4,
            height + 1.35,
            z
        );

        tank.castShadow = false;
        tank.receiveShadow = false;

        parent.add(tank);
    }

    // سور السطح
    addBox(
        parent,
        x,
        height + 0.25,
        z,
        0.16,
        0.5,
        2.5,
        MAT.concrete
    );
}

// -----------------------------------------------------
// واجهة المبنى
// -----------------------------------------------------

function createBuilding(parent, options) {
    const {
        side,
        z,
        width,
        floors,
        full,
        random
    } = options;

    const height = floors * 3.15;

    const depth = full
        ? CONFIG.fullDepth
        : CONFIG.facadeDepth;

    const x =
        side * (
            CONFIG.buildingLine + depth / 2
        );

    const facadeX =
        x - side * (depth / 2 + 0.04);

    const facadeMaterial = createFacadeMaterial(random);

    // جسم المبنى
    addBox(
        parent,
        x,
        0,
        z,
        depth,
        height,
        width,
        facadeMaterial
    );

    // سقف خرساني
    addBox(
        parent,
        x,
        height,
        z,
        depth + 0.3,
        0.18,
        width + 0.3,
        MAT.concrete
    );

    // بعض الواجهات بالطوب الأحمر
    if (random() > 0.78) {
        addBox(
            parent,
            facadeX - side * 0.035,
            0,
            z,
            0.035,
            height * 0.62,
            width,
            MAT.brick
        );
    }

    // تقسيم الواجهة إلى أدوار
    for (let floor = 0; floor < floors; floor++) {
        const floorY = floor * 3.15;

        // بروز خرسانة بين الأدوار
        if (floor > 0) {
            addBox(
                parent,
                facadeX - side * 0.1,
                floorY,
                z,
                0.16,
                0.13,
                width,
                MAT.concrete
            );
        }

        const windowCount = width >= 12 ? 3 : 2;

        for (let w = 0; w < windowCount; w++) {
            const offset =
                -width / 2 +
                1.9 +
                w * ((width - 3.8) / Math.max(1, windowCount - 1));

            const windowZ = z + offset;

            const windowY = floorY + 1.75;

            createWindow(
                parent,
                facadeX - side * 0.1,
                windowY,
                windowZ,
                side,
                random
            );

            if (floor > 0 && random() > 0.58) {
                createBalcony(
                    parent,
                    facadeX,
                    floorY + 0.3,
                    windowZ,
                    1.65,
                    side
                );
            }
        }
    }

    // باب الدور الأرضي
    createDoor(
        parent,
        facadeX - side * 0.1,
        0,
        z + width * 0.27,
        side,
        random
    );

    // بعض المباني بها محل صغير
    if (random() > 0.7) {
        addBox(
            parent,
            facadeX - side * 0.14,
            2.45,
            z - width * 0.22,
            0.12,
            0.55,
            width * 0.48,
            MAT.shop
        );
    }

    createRoofDetails(
        parent,
        x,
        height,
        z,
        side,
        random
    );

    // الجوانب الخلفية تظهر فقط في أول وآخر بيت
    if (full) {
        addBox(
            parent,
            x,
            height * 0.45,
            z - width / 2,
            depth,
            height * 0.9,
            0.12,
            facadeMaterial
        );

        addBox(
            parent,
            x,
            height * 0.45,
            z + width / 2,
            depth,
            height * 0.9,
            0.12,
            facadeMaterial
        );
    }
}

// -----------------------------------------------------
// إنشاء صف متلاصق من البيوت
// -----------------------------------------------------

function createBuildingRow(parent, side, seed) {
    const random = seededRandom(seed);

    const row = new THREE.Group();

    row.name = side > 0
        ? "BENI_SUEF_RIGHT_ROW"
        : "BENI_SUEF_LEFT_ROW";

    let currentZ = CONFIG.rowStart;

    let buildingIndex = 0;

    while (currentZ < CONFIG.rowEnd) {
        const width = Math.min(
            randomRange(
                random,
                CONFIG.minWidth,
                CONFIG.maxWidth
            ),
            CONFIG.rowEnd - currentZ
        );

        const floors = randomInt(
            random,
            CONFIG.minFloors,
            CONFIG.maxFloors
        );

        const isEndBuilding =
            buildingIndex === 0 ||
            currentZ + width >= CONFIG.rowEnd - 0.01;

        createBuilding(row, {
            side,
            z: currentZ + width / 2,
            width,
            floors,
            full: isEndBuilding,
            random
        });

        currentZ += width;
        buildingIndex++;
    }

    parent.add(row);

    return row;
}

// -----------------------------------------------------
// واجهات بني سويف على جانبي الطريق
// -----------------------------------------------------

export function createBeniSuefBuildings(chunk, chunkIndex) {
    if (!chunk) {
        throw new Error(
            "Beni Suef: chunk is required"
        );
    }

    if (chunk.userData.beniSuefCreated) {
        return chunk.userData.beniSuefBuildings;
    }

    const buildings = [];

    try {
        const right = createBuildingRow(
            chunk,
            1,
            41000 + chunkIndex
        );

        buildings.push(right);

        const left = createBuildingRow(
            chunk,
            -1,
            52000 + chunkIndex
        );

        buildings.push(left);

        chunk.userData.beniSuefBuildings = buildings;
        chunk.userData.beniSuefCreated = true;

        return buildings;

    } catch (error) {
        console.error(
            "MASHWAR: Failed to create Beni Suef buildings:",
            error
        );

        for (const row of buildings) {
            if (row) {
                disposeBeniSuefRow(row);
            }
        }

        throw error;
    }
}

// -----------------------------------------------------
// إزالة المباني عند إعادة تدوير قطعة الطريق
// -----------------------------------------------------

export function disposeBeniSuefRow(row) {
    if (!row) return;

    row.traverse(object => {
        if (!object.isMesh) return;

        if (object.geometry && !geometryCacheHas(object.geometry)) {
            object.geometry.dispose();
        }
    });

    if (row.parent) {
        row.parent.remove(row);
    }
}

function geometryCacheHas(geometry) {
    for (const cached of geometryCache.values()) {
        if (cached === geometry) return true;
    }

    return false;
}

export function removeBeniSuefBuildings(chunk) {
    if (!chunk) return;

    const buildings = chunk.userData.beniSuefBuildings;

    if (buildings) {
        for (const row of buildings) {
            disposeBeniSuefRow(row);
        }
    }

    delete chunk.userData.beniSuefBuildings;
    delete chunk.userData.beniSuefCreated;
}
