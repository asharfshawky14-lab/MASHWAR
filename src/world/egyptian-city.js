
import * as THREE from "three";

// =====================================================
// MASHWAR - EGYPTIAN ENDLESS HIGHWAY
// طريق سفر مصري مزدوج - القاهرة إلى أسيوط
// =====================================================

const CONFIG = {
    roadWidth: 18,
    laneWidth: 3.6,
    medianWidth: 1.4,
    shoulderWidth: 1.5,
    chunkLength: 180,
    chunkCount: 9,
    roadY: 0.04
};

const COLORS = {
    asphalt: 0x303438,
    asphaltEdge: 0x55585a,
    sand: 0xc5ad80,
    soil: 0x987b50,
    grass: 0x63814a,
    concrete: 0x999999,
    median: 0xb7b2a5,
    white: 0xf4f0df,
    yellow: 0xf2c94c,
    building: 0xc9b69a,
    building2: 0xd5c7ae,
    window: 0x506875,
    darkWindow: 0x263b48
};

// =====================================================
// أدوات مساعدة
// =====================================================

function material(color, roughness = 0.9, extra = {}) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness,
        ...extra
    });
}

const mats = {
    asphalt: material(COLORS.asphalt),
    asphaltEdge: material(COLORS.asphaltEdge),
    white: material(COLORS.white),
    yellow: material(COLORS.yellow),
    concrete: material(COLORS.concrete),
    median: material(COLORS.median),
    sand: material(COLORS.sand),
    soil: material(COLORS.soil),
    grass: material(COLORS.grass),
    building: material(COLORS.building),
    building2: material(COLORS.building2),
    window: material(COLORS.window, 0.25, {
        metalness: 0.15
    }),
    darkWindow: material(COLORS.darkWindow, 0.25),
    black: material(0x202326),
    metal: material(0x777d80, 0.45, {
        metalness: 0.7
    }),
    red: material(0xe52b25, 0.4, {
        emissive: 0x550000
    }),
    orange: material(0xffa21a, 0.4, {
        emissive: 0x442000
    }),
    green: material(0x16b957, 0.4, {
        emissive: 0x003c16
    })
};

function box(parent, x, y, z, w, h, d, mat) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        mat
    );

    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    parent.add(mesh);

    return mesh;
}

function cylinder(
    parent,
    x,
    y,
    z,
    radiusTop,
    radiusBottom,
    height,
    mat,
    segments = 12
) {
    const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(
            radiusTop,
            radiusBottom,
            height,
            segments
        ),
        mat
    );

    mesh.position.set(x, y + height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    parent.add(mesh);

    return mesh;
}

function seededRandom(seed) {
    let value = seed >>> 0;

    return function () {
        value = (value * 1664525 + 1013904223) >>> 0;

        return value / 4294967296;
    };
}

// =====================================================
// الأرض والطريق
// =====================================================

function createRoad(chunk, random) {
    const length = CONFIG.chunkLength;

    // الأرض الطبيعية
    box(
        chunk,
        0,
        -0.5,
        0,
        180,
        1,
        length,
        mats.sand
    );

    // الطريق الرئيسي
    box(
        chunk,
        0,
        0,
        0,
        CONFIG.roadWidth,
        0.12,
        length,
        mats.asphalt
    );

    // أكتاف الطريق
    for (const side of [-1, 1]) {
        box(
            chunk,
            side * 9.8,
            0,
            0,
            1.6,
            0.1,
            length,
            mats.asphaltEdge
        );

        // الخط الأبيض الجانبي
        box(
            chunk,
            side * 8.9,
            0.13,
            0,
            0.12,
            0.025,
            length,
            mats.white
        );
    }

    // الفاصل الوسطي
    box(
        chunk,
        0,
        0.12,
        0,
        CONFIG.medianWidth,
        0.3,
        length,
        mats.median
    );

    // حواجز الفاصل
    box(
        chunk,
        -0.72,
        0.42,
        0,
        0.12,
        0.32,
        length,
        mats.concrete
    );

    box(
        chunk,
        0.72,
        0.42,
        0,
        0.12,
        0.32,
        length,
        mats.concrete
    );

    // خطوط الحارات المتقطعة
    for (let z = -length / 2 + 5; z < length / 2; z += 12) {
        for (const side of [-1, 1]) {
            const center = side * 4.3;

            box(
                chunk,
                center,
                0.14,
                z,
                0.12,
                0.025,
                5,
                mats.white
            );
        }
    }

    // عواكس الطريق على الفاصل
    for (let z = -length / 2 + 8; z < length / 2; z += 18) {
        box(
            chunk,
            0,
            0.3,
            z,
            0.18,
            0.12,
            0.5,
            mats.yellow
        );
    }
}

// =====================================================
// البيوت المصرية
// =====================================================

function createHouse(parent, x, z, random, style = 0) {
    const width = 9 + random() * 6;
    const depth = 9 + random() * 5;
    const floors = 2 + Math.floor(random() * 3);
    const floorHeight = 3.2;

    const height = floors * floorHeight;

    const houseMat = style === 1
        ? mats.building2
        : mats.building;

    // جسم البيت
    box(
        parent,
        x,
        0,
        z,
        width,
        height,
        depth,
        houseMat
    );

    // السطح
    box(
        parent,
        x,
        height,
        z,
        width + 0.4,
        0.22,
        depth + 0.4,
        mats.concrete
    );

    // حائط السطح
    for (const side of [-1, 1]) {
        box(
            parent,
            x + side * (width / 2 - 0.12),
            height + 0.2,
            z,
            0.22,
            0.8,
            depth,
            mats.building2
        );
    }

    // النوافذ
    const columns = Math.max(
        2,
        Math.floor(width / 2.4)
    );

    for (let floor = 0; floor < floors; floor++) {
        for (let col = 0; col < columns; col++) {
            const windowX =
                x - width / 2 + 1.4 + col * 2.3;

            const windowY =
                floor * floorHeight + 1.15;

            // إطار النافذة
            box(
                parent,
                windowX,
                windowY,
                z + depth / 2 + 0.08,
                1.05,
                1.25,
                0.12,
                mats.white
            );

            // الزجاج
            box(
                parent,
                windowX,
                windowY + 0.08,
                z + depth / 2 + 0.16,
                0.82,
                0.95,
                0.05,
                mats.window
            );

            // تقسيم النافذة
            box(
                parent,
                windowX,
                windowY + 0.08,
                z + depth / 2 + 0.2,
                0.04,
                0.95,
                0.04,
                mats.white
            );

            // شرفة صغيرة
            if (random() > 0.45) {
                box(
                    parent,
                    windowX,
                    windowY - 0.55,
                    z + depth / 2 + 0.55,
                    1.45,
                    0.1,
                    0.9,
                    mats.concrete
                );

                box(
                    parent,
                    windowX,
                    windowY - 0.18,
                    z + depth / 2 + 0.95,
                    1.4,
                    0.55,
                    0.06,
                    mats.metal
                );
            }
        }
    }

    // باب البيت
    box(
        parent,
        x,
        0,
        z + depth / 2 + 0.12,
        1.2,
        2.2,
        0.2,
        mats.darkWindow
    );

    // تكييفات
    if (floors > 1) {
        for (let i = 0; i < floors - 1; i++) {
            box(
                parent,
                x + width / 2 + 0.2,
                i * floorHeight + 1.3,
                z,
                0.55,
                0.5,
                0.8,
                mats.white
            );
        }
    }

    // خزان المياه على السطح
    cylinder(
        parent,
        x + width * 0.25,
        height + 0.25,
        z,
        0.8,
        0.8,
        1.4,
        mats.metal,
        16
    );

    // ماسورة على الواجهة
    cylinder(
        parent,
        x - width / 2 - 0.15,
        0,
        z + depth / 2 + 0.2,
        0.08,
        0.08,
        height,
        mats.metal,
        8
    );
}

// =====================================================
// المحلات المصرية
// =====================================================

function createShop(parent, x, z, random) {
    const width = 8;
    const height = 4.2;
    const depth = 7;

    box(
        parent,
        x,
        0,
        z,
        width,
        height,
        depth,
        mats.building2
    );

    // واجهة المحل
    box(
        parent,
        x,
        0.2,
        z + depth / 2 + 0.08,
        width - 0.7,
        2.7,
        0.18,
        mats.darkWindow
    );

    // باب زجاجي
    box(
        parent,
        x - 2.3,
        0.15,
        z + depth / 2 + 0.2,
        1.3,
        2.5,
        0.12,
        mats.window
    );

    // يافطة المحل
    const sign = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.9, 0.3),
        material(0x22516a)
    );

    sign.position.set(
        x,
        3.45,
        z + depth / 2 + 0.25
    );

    parent.add(sign);

    // كتابة عربية على اليافطة
    const canvas = document.createElement("canvas");

    canvas.width = 512;
    canvas.height = 128;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#174b66";
    ctx.fillRect(0, 0, 512, 128);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 58px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const names = [
        "بقالة",
        "ماركت",
        "مطعم",
        "قطع غيار",
        "كهرباء"
    ];

    ctx.fillText(
        names[Math.floor(random() * names.length)],
        256,
        64
    );

    const texture = new THREE.CanvasTexture(canvas);

    texture.colorSpace = THREE.SRGBColorSpace;

    const board = new THREE.Mesh(
        new THREE.PlaneGeometry(width - 0.3, 0.8),
        new THREE.MeshBasicMaterial({
            map: texture
        })
    );

    board.position.set(
        x,
        3.45,
        z + depth / 2 + 0.42
    );

    parent.add(board);

    // مظلة المحل
    box(
        parent,
        x,
        2.9,
        z + depth / 2 + 0.65,
        width + 0.4,
        0.15,
        1.4,
        material(0x496f87)
    );
}

// =====================================================
// أعمدة الإنارة
// =====================================================

function createStreetLight(parent, x, z) {
    const poleHeight = 9;

    cylinder(
        parent,
        x,
        0,
        z,
        0.1,
        0.2,
        poleHeight,
        mats.metal,
        10
    );

    // ذراع الكشاف
    const arm = box(
        parent,
        x + (x > 0 ? -0.9 : 0.9),
        poleHeight - 0.1,
        z,
        1.9,
        0.13,
        0.13,
        mats.metal
    );

    // رأس الكشاف
    const lamp = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.25, 0.55),
        material(0x252c30)
    );

    lamp.position.set(
        x + (x > 0 ? -1.6 : 1.6),
        poleHeight,
        z
    );

    parent.add(lamp);

    const bulb = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.08, 0.32),
        new THREE.MeshBasicMaterial({
            color: 0xffe4a1
        })
    );

    bulb.position.set(
        lamp.position.x,
        poleHeight - 0.16,
        z
    );

    parent.add(bulb);
}

// =====================================================
// إشارات المرور
// =====================================================

function createTrafficLight(parent, x, z) {
    const signal = new THREE.Group();

    signal.position.set(x, 0, z);

    parent.add(signal);

    // العمود
    cylinder(
        signal,
        0,
        0,
        0,
        0.09,
        0.14,
        5.5,
        mats.metal
    );

    // صندوق الإشارة
    box(
        signal,
        0,
        5.5,
        0,
        0.75,
        1.9,
        0.65,
        mats.black
    );

    const lights = [];

    const lightMaterials = [
        mats.red,
        mats.orange,
        mats.green
    ];

    for (let i = 0; i < 3; i++) {
        const lamp = new THREE.Mesh(
            new THREE.CircleGeometry(0.23, 24),
            lightMaterials[i]
        );

        lamp.position.set(
            0,
            6.1 - i * 0.58,
            0.34
        );

        signal.add(lamp);

        lights.push(lamp);
    }

    signal.userData.lights = lights;

    signal.userData.phase = Math.random() * 20;

    return signal;
}

// =====================================================
// الأشجار والنخيل
// =====================================================

function createPalm(parent, x, z, random) {
    const height = 5 + random() * 3;

    cylinder(
        parent,
        x,
        0,
        z,
        0.22,
        0.35,
        height,
        material(0x785334),
        8
    );

    const crown = new THREE.Group();

    crown.position.set(x, height, z);

    parent.add(crown);

    const leafMat = material(0x477b36);

    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;

        const leaf = new THREE.Mesh(
            new THREE.BoxGeometry(0.45, 0.12, 3.8),
            leafMat
        );

        leaf.position.set(
            Math.sin(angle) * 1.3,
            0.15,
            Math.cos(angle) * 1.3
        );

        leaf.rotation.y = angle;
        leaf.rotation.x = -0.15;

        leaf.castShadow = true;

        crown.add(leaf);
    }
}

function createTree(parent, x, z, random) {
    const height = 3 + random() * 2;

    cylinder(
        parent,
        x,
        0,
        z,
        0.14,
        0.2,
        height,
        material(0x694a2d),
        8
    );

    const top = new THREE.Mesh(
        new THREE.SphereGeometry(
            1.3 + random(),
            10,
            8
        ),
        material(0x47743a)
    );

    top.position.set(x, height + 1, z);

    top.castShadow = true;

    parent.add(top);
}

// =====================================================
// منطقة زراعية
// =====================================================

function createFarm(parent, side, z, random) {
    const x = side * (20 + random() * 13);

    box(
        parent,
        x,
        0,
        z,
        22,
        0.08,
        45,
        mats.grass
    );

    // خطوط الزراعة
    for (let i = 0; i < 7; i++) {
        const rowX = x - 9 + i * 3;

        box(
            parent,
            rowX,
            0.1,
            z,
            0.13,
            0.06,
            40,
            mats.soil
        );
    }

    // أشجار النخيل
    for (let i = 0; i < 3; i++) {
        createPalm(
            parent,
            x + side * (random() * 5),
            z - 15 + i * 14,
            random
        );
    }

    // مجرى مياه زراعي
    if (random() > 0.4) {
        box(
            parent,
            side * 17,
            0.04,
            z,
            1.8,
            0.08,
            40,
            material(0x428ba0, 0.2)
        );
    }
}

// =====================================================
// منطقة صحراوية
// =====================================================

function createDesert(parent, side, z, random) {
    for (let i = 0; i < 5; i++) {
        const x = side * (18 + random() * 30);

        const hill = new THREE.Mesh(
            new THREE.SphereGeometry(
                1,
                12,
                8
            ),
            mats.sand
        );

        const sx = 7 + random() * 15;
        const sy = 2 + random() * 5;
        const sz = 8 + random() * 18;

        hill.scale.set(sx, sy, sz);

        hill.position.set(
            x,
            sy * 0.55 - 0.2,
            z + random() * 65 - 32
        );

        hill.receiveShadow = true;

        parent.add(hill);
    }
}

// =====================================================
// حواجز الطريق واللوحات
// =====================================================

function createGuardRail(parent, side, z) {
    const x = side * 11.5;

    // أعمدة الحاجز
    for (let i = -80; i < 90; i += 5) {
        cylinder(
            parent,
            x,
            0,
            z + i,
            0.06,
            0.06,
            0.8,
            mats.metal,
            8
        );
    }

    // جسم الحاجز
    box(
        parent,
        x,
        0.65,
        z,
        0.16,
        0.16,
        170,
        mats.metal
    );
}

function createRoadSign(parent, x, z, text, random) {
    cylinder(
        parent,
        x,
        0,
        z,
        0.07,
        0.09,
        3.5,
        mats.metal,
        8
    );

    const canvas = document.createElement("canvas");

    canvas.width = 512;
    canvas.height = 180;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#12613c";
    ctx.fillRect(0, 0, 512, 180);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 8;

    ctx.strokeRect(6, 6, 500, 168);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 48px Arial";

    ctx.fillText(text, 256, 90);

    const texture = new THREE.CanvasTexture(canvas);

    texture.colorSpace = THREE.SRGBColorSpace;

    const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(5.5, 2),
        new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
        })
    );

    sign.position.set(x, 3.7, z);

    parent.add(sign);
}

// =====================================================
// بناء قطعة الطريق
// =====================================================

function createChunk(index) {
    const chunk = new THREE.Group();

    const random = seededRandom(index + 9182);

    createRoad(chunk, random);

    // تحديد طبيعة المنطقة
    let zone;

    if (index < 2) {
        zone = "urban";
    } else if (index < 6) {
        zone = "farm";
    } else if (index < 9) {
        zone = "desert";
    } else {
        zone = "upper";
    }

    // عناصر جانبية
    for (const side of [-1, 1]) {
        createGuardRail(chunk, side, 0);

        // الإنارة
        for (let z = -75; z <= 75; z += 50) {
            createStreetLight(
                chunk,
                side * 12.5,
                z
            );
        }

        if (zone === "urban") {
            for (let z = -65; z <= 65; z += 32) {
                const x = side * (22 + random() * 5);

                if (random() > 0.35) {
                    createHouse(
                        chunk,
                        x,
                        z,
                        random
                    );
                } else {
                    createShop(
                        chunk,
                        x,
                        z,
                        random
                    );
                }
            }
        }

        if (zone === "farm") {
            for (let z = -65; z <= 65; z += 55) {
                createFarm(
                    chunk,
                    side,
                    z,
                    random
                );
            }

            if (random() > 0.35) {
                createHouse(
                    chunk,
                    side * 28,
                    random() * 80 - 40,
                    random,
                    1
                );
            }
        }

        if (zone === "desert") {
            createDesert(
                chunk,
                side,
                0,
                random
            );

            if (random() > 0.7) {
                createPalm(
                    chunk,
                    side * 20,
                    random() * 100 - 50,
                    random
                );
            }
        }

        if (zone === "upper") {
            createFarm(
                chunk,
                side,
                0,
                random
            );

            for (let z = -65; z <= 65; z += 55) {
                if (random() > 0.35) {
                    createHouse(
                        chunk,
                        side * (23 + random() * 7),
                        z,
                        random,
                        1
                    );
                }
            }
        }
    }

    // إشارة مرور عند بعض التقاطعات
    if (index % 3 === 0) {
        const signal1 = createTrafficLight(
            chunk,
            -10.5,
            -55
        );

        const signal2 = createTrafficLight(
            chunk,
            10.5,
            -55
        );

        chunk.userData.signals = [
            signal1,
            signal2
        ];
    } else {
        chunk.userData.signals = [];
    }

    // لوحات اتجاهات
    if (index % 2 === 0) {
        createRoadSign(
            chunk,
            13,
            48,
            zone === "urban"
                ? "القاهرة"
                : zone === "farm"
                ? "المنيا"
                : zone === "desert"
                ? "طريق الصعيد"
                : "أسيوط",
            random
        );
    }

    return chunk;
}

// =====================================================
// إنشاء العالم
// =====================================================

export function createEgyptianCity(scene) {
    const world = new THREE.Group();

    world.name = "MASHWAR_ENDLESS_HIGHWAY";

    scene.add(world);

    const chunks = [];

    const half = Math.floor(CONFIG.chunkCount / 2);

    // إنشاء القطع الأولى
    for (let i = -half; i <= half; i++) {
        const chunk = createChunk(i);

        chunk.position.z = i * CONFIG.chunkLength;

        chunk.userData.chunkIndex = i;

        world.add(chunk);

        chunks.push(chunk);
    }

    // تحديث إشارات المرور
    function update(delta = 0.016, playerZ = 0) {
        for (const chunk of chunks) {
            const signals = chunk.userData.signals || [];

            for (const signal of signals) {
                signal.userData.phase += delta;

                const phase =
                    signal.userData.phase % 18;

                const lights =
                    signal.userData.lights;

                lights[0].material = phase < 8
                    ? mats.red
                    : mats.black;

                lights[1].material = (
                    phase >= 8 && phase < 10
                )
                    ? mats.orange
                    : mats.black;

                lights[2].material = phase >= 10
                    ? mats.green
                    : mats.black;
            }
        }

        // إعادة تدوير قطع الطريق خلف اللاعب
        for (const chunk of chunks) {
            const endZ =
                chunk.position.z + CONFIG.chunkLength / 2;

            if (endZ < playerZ - CONFIG.chunkLength) {
                const furthest = Math.max(
                    ...chunks.map(c => c.position.z)
                );

                const nextIndex =
                    chunk.userData.chunkIndex +
                    CONFIG.chunkCount;

                const replacement = createChunk(nextIndex);

                replacement.position.z =
                    furthest + CONFIG.chunkLength;

                replacement.userData.chunkIndex =
                    nextIndex;

                world.remove(chunk);

                world.add(replacement);

                const position = chunks.indexOf(chunk);

                chunks[position] = replacement;
            }
        }
    }

    world.userData.update = update;

    world.userData.chunks = chunks;

    world.userData.roadLength = CONFIG.chunkLength;

    console.log("MASHWAR highway generated");

    return world;
}
