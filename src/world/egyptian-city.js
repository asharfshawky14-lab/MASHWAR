
import * as THREE from "three";

const C = {
    asphalt: 0x303438,
    shoulder: 0x77736b,
    concrete: 0xaaa69d,
    white: 0xf5f2e9,
    yellow: 0xf4c84c,
    sand: 0xc9b28a,
    soil: 0x92764d,
    grass: 0x587b42,
    building: 0xcbb99e,
    building2: 0xd8c8ae,
    glass: 0x496b7b,
    dark: 0x202a30,
    metal: 0x747d82,
    red: 0xe62c26,
    amber: 0xffa51c,
    green: 0x20b45a
};

const M = {};

function makeMat(color, roughness = 0.85, extra = {}) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness,
        ...extra
    });
}

for (const [key, color] of Object.entries(C)) {
    M[key] = makeMat(color);
}

M.glass.roughness = 0.25;
M.metal.metalness = 0.65;
M.metal.roughness = 0.4;

const LENGTH = 180;
const CHUNK_COUNT = 9;
const ROAD_HALF = 10.8;
const ROAD_Y = 0.08;

function rng(seed) {
    let n = seed >>> 0;

    return () => {
        n = (n * 1664525 + 1013904223) >>> 0;
        return n / 4294967296;
    };
}

function addBox(parent, x, y, z, w, h, d, mat) {
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

function addCylinder(
    parent,
    x,
    y,
    z,
    radius,
    height,
    mat,
    segments = 12
) {
    const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(
            radius,
            radius * 1.25,
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

function addTextBoard(parent, x, y, z, width, height, label, color = "#17613f") {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 160;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 512, 160);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 9;
    ctx.strokeRect(7, 7, 498, 146);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 55px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";
    ctx.fillText(label, 256, 80, 470);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const boardMat = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide
    });

    const board = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        boardMat
    );

    board.position.set(x, y, z);
    parent.add(board);

    return board;
}

// -----------------------------------------------------
// الطريق المزدوج
// -----------------------------------------------------

function buildRoad(chunk) {
    addBox(
        chunk, 0, -0.55, 0,
        180, 0.8, LENGTH,
        M.sand
    );

    // الاتجاهان
    for (const side of [-1, 1]) {
        addBox(
            chunk,
            side * 5.35,
            0,
            0,
            10.7,
            0.16,
            LENGTH,
            M.asphalt
        );

        // كتف الطريق الخارجي
        addBox(
            chunk,
            side * 11.45,
            0,
            0,
            1.5,
            0.12,
            LENGTH,
            M.shoulder
        );

        // الخط الأبيض الخارجي
        addBox(
            chunk,
            side * 10.75,
            ROAD_Y,
            0,
            0.13,
            0.025,
            LENGTH,
            M.white
        );

        // فواصل الحارات
        for (const laneX of [side * 1.8, side * 5.35]) {
            for (let z = -LENGTH / 2 + 5; z < LENGTH / 2; z += 12) {
                addBox(
                    chunk,
                    laneX,
                    ROAD_Y,
                    z,
                    0.11,
                    0.025,
                    5,
                    M.white
                );
            }
        }
    }

    // الفاصل الوسطي
    addBox(
        chunk,
        0,
        0.12,
        0,
        1.7,
        0.45,
        LENGTH,
        M.concrete
    );

    // عواكس الفاصل
    for (let z = -LENGTH / 2 + 8; z < LENGTH / 2; z += 16) {
        addBox(
            chunk,
            0,
            0.59,
            z,
            0.2,
            0.09,
            0.45,
            M.yellow
        );
    }

    // حواف الفاصل
    for (const side of [-1, 1]) {
        addBox(
            chunk,
            side * 0.85,
            0.58,
            0,
            0.12,
            0.45,
            LENGTH,
            M.concrete
        );
    }
}

// -----------------------------------------------------
// واجهة مبنى تواجه الطريق
// -----------------------------------------------------

function createFacadeWindow(parent, side, x, y, z) {
    const faceX = x - side * 0.08;

    addBox(
        parent,
        faceX,
        y,
        z,
        0.16,
        1.25,
        1.15,
        M.white
    );

    addBox(
        parent,
        faceX - side * 0.1,
        y + 0.09,
        z,
        0.07,
        0.98,
        0.88,
        M.glass
    );

    addBox(
        parent,
        faceX - side * 0.15,
        y + 0.09,
        z,
        0.035,
        0.98,
        0.045,
        M.white
    );

    addBox(
        parent,
        faceX - side * 0.15,
        y + 0.09,
        z,
        0.035,
        0.045,
        0.88,
        M.white
    );
}

function createHouse(parent, side, z, random, village = false) {
    const depth = 8 + random() * 4;
    const width = 11 + random() * 6;
    const floors = village
        ? 1 + Math.floor(random() * 2)
        : 2 + Math.floor(random() * 3);

    const height = floors * 3.15;
    const x = side * (18 + depth / 2);

    const bodyMat = random() > 0.5
        ? M.building
        : M.building2;

    addBox(
        parent,
        x,
        0,
        z,
        depth,
        height,
        width,
        bodyMat
    );

    // سطح البيت
    addBox(
        parent,
        x,
        height,
        z,
        depth + 0.35,
        0.22,
        width + 0.35,
        M.concrete
    );

    // سور السطح
    addBox(
        parent,
        x,
        height + 0.22,
        z - width / 2 + 0.1,
        depth,
        0.7,
        0.18,
        M.building2
    );

    addBox(
        parent,
        x,
        height + 0.22,
        z + width / 2 - 0.1,
        depth,
        0.7,
        0.18,
        M.building2
    );

    // النوافذ على واجهة الطريق
    const columns = Math.max(2, Math.floor(width / 2.5));

    for (let floor = 0; floor < floors; floor++) {
        for (let col = 0; col < columns; col++) {
            const windowZ =
                z - width / 2 + 1.5 + col * 2.5;

            const windowY = floor * 3.15 + 1.05;

            createFacadeWindow(
                parent,
                side,
                x,
                windowY,
                windowZ
            );

            // بلكونة
            if (random() > 0.58) {
                const balconyX = x - side * 0.65;

                addBox(
                    parent,
                    balconyX,
                    windowY - 0.55,
                    windowZ,
                    1.05,
                    0.12,
                    1.55,
                    M.concrete
                );

                addBox(
                    parent,
                    balconyX - side * 0.5,
                    windowY - 0.15,
                    windowZ,
                    0.08,
                    0.65,
                    1.5,
                    M.metal
                );
            }
        }
    }

    // باب خارجي
    addBox(
        parent,
        x - side * 0.1,
        0,
        z + width * 0.25,
        0.18,
        2.25,
        1.2,
        M.dark
    );

    // ماسورة صرف
    addBox(
        parent,
        x - side * (depth / 2 + 0.12),
        0,
        z - width / 2 + 0.25,
        0.12,
        height,
        0.12,
        M.metal
    );

    // خزان مياه
    addCylinder(
        parent,
        x,
        height + 0.25,
        z - width * 0.25,
        0.7,
        1.35,
        M.metal,
        16
    );

    // تكييفات
    for (let i = 1; i < floors; i++) {
        addBox(
            parent,
            x - side * (depth / 2 + 0.22),
            i * 3.15 + 0.8,
            z + width * 0.28,
            0.45,
            0.5,
            0.8,
            M.white
        );
    }
}

// -----------------------------------------------------
// المحلات
// -----------------------------------------------------

function createShop(parent, side, z, random) {
    const depth = 7;
    const width = 9;
    const x = side * (18 + depth / 2);

    addBox(
        parent,
        x,
        0,
        z,
        depth,
        4.1,
        width,
        M.building2
    );

    // واجهة زجاجية
    addBox(
        parent,
        x - side * (depth / 2 + 0.06),
        0.2,
        z,
        0.12,
        2.65,
        width - 0.8,
        M.glass
    );

    // باب المحل
    addBox(
        parent,
        x - side * (depth / 2 + 0.15),
        0.15,
        z + width * 0.28,
        0.12,
        2.5,
        1.3,
        M.dark
    );

    // مظلة
    addBox(
        parent,
        x - side * (depth / 2 + 0.7),
        2.8,
        z,
        1.35,
        0.14,
        width + 0.5,
        M.red
    );

    const names = [
        "بقالة",
        "ماركت",
        "مطعم",
        "قطع غيار",
        "كهرباء",
        "مخبوزات"
    ];

    const label = names[
        Math.floor(random() * names.length)
    ];

    const sign = new THREE.Group();
    parent.add(sign);

    addTextBoard(
        sign,
        0,
        0,
        0,
        width - 0.4,
        0.9,
        label,
        "#174b66"
    );

    const board = sign.children[0];

    board.position.set(
        x - side * (depth / 2 + 0.18),
        3.5,
        z
    );

    board.rotation.y = side > 0
        ? -Math.PI / 2
        : Math.PI / 2;
}

// -----------------------------------------------------
// أشجار ونخيل
// -----------------------------------------------------

function createPalm(parent, x, z, random) {
    const height = 5 + random() * 2.5;

    addCylinder(
        parent,
        x,
        0,
        z,
        0.23,
        height,
        makeMat(0x775236),
        9
    );

    const leafMat = makeMat(0x47763c);

    for (let i = 0; i < 9; i++) {
        const angle = i * Math.PI * 2 / 9;

        const leaf = new THREE.Mesh(
            new THREE.BoxGeometry(0.45, 0.12, 4),
            leafMat
        );

        leaf.position.set(
            x + Math.sin(angle) * 1.2,
            height + 0.2,
            z + Math.cos(angle) * 1.2
        );

        leaf.rotation.y = angle;
        leaf.rotation.x = -0.18;

        parent.add(leaf);
    }
}

function createTree(parent, x, z, random) {
    addCylinder(
        parent,
        x,
        0,
        z,
        0.16,
        3.2,
        makeMat(0x6b4b2b),
        8
    );

    const crown = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 10, 8),
        makeMat(0x47743a)
    );

    crown.position.set(x, 4.3, z);
    crown.scale.set(1, 0.85, 1);

    parent.add(crown);
}

// -----------------------------------------------------
// المزارع والترع
// -----------------------------------------------------

function createFarm(parent, side, z, random) {
    const x = side * (24 + random() * 10);

    addBox(
        parent,
        x,
        0,
        z,
        28,
        0.07,
        42,
        M.grass
    );

    for (let row = 0; row < 8; row++) {
        addBox(
            parent,
            x - 12 + row * 3.4,
            0.08,
            z,
            0.12,
            0.05,
            37,
            M.soil
        );
    }

    for (let i = 0; i < 3; i++) {
        createPalm(
            parent,
            x + side * (random() * 4),
            z - 14 + i * 14,
            random
        );
    }

    // ترعة
    addBox(
        parent,
        side * 17,
        0.03,
        z,
        1.5,
        0.06,
        38,
        makeMat(0x438ca5, 0.2, {
            metalness: 0.1
        })
    );
}

// -----------------------------------------------------
// صحراء وتلال
// -----------------------------------------------------

function createDesert(parent, side, z, random) {
    for (let i = 0; i < 6; i++) {
        const hill = new THREE.Mesh(
            new THREE.SphereGeometry(1, 12, 8),
            M.sand
        );

        const sx = 7 + random() * 13;
        const sy = 2 + random() * 4;
        const sz = 9 + random() * 18;

        hill.scale.set(sx, sy, sz);

        hill.position.set(
            side * (25 + random() * 35),
            sy * 0.45 - 0.15,
            z + random() * 110 - 55
        );

        hill.receiveShadow = true;
        parent.add(hill);
    }
}

// -----------------------------------------------------
// أعمدة الإنارة الفعلية
// -----------------------------------------------------

function createStreetLight(parent, side, z) {
    const x = side * 12.7;
    const inward = -side;

    addCylinder(
        parent,
        x,
        0,
        z,
        0.12,
        8.5,
        M.metal,
        10
    );

    const arm = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.13, 0.13),
        M.metal
    );

    arm.position.set(
        x + inward * 0.95,
        8.45,
        z
    );

    parent.add(arm);

    const lamp = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 0.25, 0.6),
        makeMat(0x30383d)
    );

    lamp.position.set(
        x + inward * 1.8,
        8.35,
        z
    );

    parent.add(lamp);

    const bulb = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.06, 0.38),
        new THREE.MeshBasicMaterial({
            color: 0xffe8b0
        })
    );

    bulb.position.set(
        lamp.position.x,
        8.19,
        z
    );

    parent.add(bulb);

    const light = new THREE.PointLight(
        0xffd99a,
        0,
        25,
        2
    );

    light.position.set(
        lamp.position.x,
        8.05,
        z
    );

    parent.add(light);

    parent.userData.streetLights ??= [];
    parent.userData.streetLights.push(light);
}

// -----------------------------------------------------
// إشارات مرور على طرق الخدمة
// -----------------------------------------------------

function createTrafficLight(parent, side, z) {
    const group = new THREE.Group();

    group.position.set(
        side * 12.8,
        0,
        z
    );

    parent.add(group);

    addCylinder(
        group,
        0,
        0,
        0,
        0.09,
        5.6,
        M.metal,
        10
    );

    addBox(
        group,
        0,
        5.5,
        0,
        0.72,
        1.9,
        0.65,
        M.dark
    );

    const bulbs = [];

    const colors = [
        C.red,
        C.amber,
        C.green
    ];

    for (let i = 0; i < 3; i++) {
        const bulb = new THREE.Mesh(
            new THREE.CircleGeometry(0.23, 24),
            new THREE.MeshBasicMaterial({
                color: colors[i]
            })
        );

        bulb.position.set(
            0,
            6.05 - i * 0.57,
            0.34
        );

        group.add(bulb);
        bulbs.push(bulb);
    }

    const lights = colors.map((color, index) => {
        const light = new THREE.PointLight(
            color,
            0,
            3
        );

        light.position.set(
            0,
            6.05 - index * 0.57,
            0.65
        );

        group.add(light);
        return light;
    });

    group.userData.bulbs = bulbs;
    group.userData.lights = lights;
    group.userData.timer = Math.random() * 18;

    return group;
}

// -----------------------------------------------------
// لوحات الطرق
// -----------------------------------------------------

function createRoadSign(parent, side, z, label) {
    const x = side * 13.7;

    addCylinder(
        parent,
        x,
        0,
        z,
        0.09,
        3.8,
        M.metal,
        8
    );

    const board = addTextBoard(
        parent,
        x - side * 0.1,
        3.9,
        z,
        5.5,
        1.8,
        label,
        "#12603b"
    );

    board.rotation.y = side > 0
        ? -Math.PI / 2
        : Math.PI / 2;
}

// -----------------------------------------------------
// حواجز الطريق
// -----------------------------------------------------

function createGuardRail(parent, side) {
    const x = side * 12.3;

    addBox(
        parent,
        x,
        0.75,
        0,
        0.16,
        0.17,
        LENGTH,
        M.metal
    );

    for (let z = -LENGTH / 2 + 5; z < LENGTH / 2; z += 6) {
        addCylinder(
            parent,
            x,
            0,
            z,
            0.055,
            0.85,
            M.metal,
            8
        );
    }
}

// -----------------------------------------------------
// تنظيف موارد قطعة الطريق
// -----------------------------------------------------

function disposeChunk(chunk) {
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();

    chunk.traverse(object => {
        if (!object.isMesh) return;

        if (object.geometry) {
            geometries.add(object.geometry);
        }

        const list = Array.isArray(object.material)
            ? object.material
            : [object.material];

        for (const mat of list) {
            if (!mat) continue;

            materials.add(mat);

            for (const value of Object.values(mat)) {
                if (value && value.isTexture) {
                    textures.add(value);
                }
            }
        }
    });

    geometries.forEach(g => g.dispose());

    materials.forEach(mat => {
        if (!Object.values(M).includes(mat)) {
            mat.dispose();
        }
    });

    textures.forEach(texture => texture.dispose());
}

// -----------------------------------------------------
// إنشاء قطعة طريق
// -----------------------------------------------------

function createChunk(index) {
    const chunk = new THREE.Group();
    const random = rng(index + 72531);

    chunk.name = `MASHWAR_CHUNK_${index}`;

    buildRoad(chunk);

    let zone;

    // مناطق تتغير تدريجيًا على امتداد الرحلة
    const phase = ((index % 16) + 16) % 16;

    if (phase < 4) {
        zone = "urban";
    } else if (phase < 8) {
        zone = "farm";
    } else if (phase < 12) {
        zone = "desert";
    } else {
        zone = "upper";
    }

    chunk.userData.zone = zone;
    chunk.userData.signals = [];
    chunk.userData.streetLights = [];

    for (const side of [-1, 1]) {
        createGuardRail(chunk, side);

        for (let z = -70; z <= 70; z += 45) {
            createStreetLight(
                chunk,
                side,
                z
            );
        }

        if (zone === "urban") {
            for (let z = -68; z <= 68; z += 28) {
                if (random() > 0.35) {
                    createHouse(
                        chunk,
                        side,
                        z,
                        random
                    );
                } else {
                    createShop(
                        chunk,
                        side,
                        z,
                        random
                    );
                }
            }
        }

        if (zone === "farm") {
            for (let z = -55; z <= 55; z += 55) {
                createFarm(
                    chunk,
                    side,
                    z,
                    random
                );
            }

            if (random() > 0.3) {
                createHouse(
                    chunk,
                    side,
                    random() * 90 - 45,
                    random,
                    true
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

            if (random() > 0.6) {
                createPalm(
                    chunk,
                    side * 24,
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

            for (let z = -55; z <= 55; z += 55) {
                if (random() > 0.3) {
                    createHouse(
                        chunk,
                        side,
                        z,
                        random,
                        true
                    );
                }
            }
        }
    }

    // إشارات عند مداخل طرق خدمة جانبية
    if (index % 4 === 0) {
        chunk.userData.signals.push(
            createTrafficLight(chunk, -1, -60),
            createTrafficLight(chunk, 1, 60)
        );
    }

    const destinations = {
        urban: "القاهرة",
        farm: "المنيا",
        desert: "طريق الصعيد",
        upper: "أسيوط"
    };

    if (index % 2 === 0) {
        createRoadSign(
            chunk,
            1,
            48,
            destinations[zone]
        );
    }

    return chunk;
}

// -----------------------------------------------------
// إنشاء الطريق اللانهائي
// -----------------------------------------------------

export function createEgyptianCity(scene) {
    const world = new THREE.Group();

    world.name = "MASHWAR_ENDLESS_HIGHWAY";
    scene.add(world);

    const chunks = [];
    const half = Math.floor(CHUNK_COUNT / 2);

    for (let i = -half; i <= half; i++) {
        const chunk = createChunk(i);

        chunk.position.z = i * LENGTH;
        chunk.userData.chunkIndex = i;

        world.add(chunk);
        chunks.push(chunk);
    }

    function update(delta = 0.016, playerZ = 0, night = false) {
        // تحديث الإشارات
        for (const chunk of chunks) {
            for (const signal of chunk.userData.signals) {
                signal.userData.timer += delta;

                const phase = signal.userData.timer % 18;

                const active = phase < 8
                    ? 0
                    : phase < 10
                    ? 1
                    : 2;

                signal.userData.bulbs.forEach((bulb, i) => {
                    bulb.material.color.setHex(
                        i === active
                            ? [C.red, C.amber, C.green][i]
                            : 0x252525
                    );
                });

                signal.userData.lights.forEach((light, i) => {
                    light.intensity = night && i === active
                        ? 1.5
                        : 0;
                });
            }

            // إنارة ليلية فعلية
            for (const light of chunk.userData.streetLights) {
                light.intensity = night ? 1.4 : 0;
            }
        }

        // تدوير القطع التي أصبحت خلف اللاعب
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            const end = chunk.position.z + LENGTH / 2;

            if (end < playerZ - LENGTH) {
                const furthest = Math.max(
                    ...chunks.map(item => item.position.z)
                );

                const nextIndex =
                    chunk.userData.chunkIndex + CHUNK_COUNT;

                const replacement = createChunk(nextIndex);

                replacement.position.z = furthest + LENGTH;
                replacement.userData.chunkIndex = nextIndex;

                world.remove(chunk);
                disposeChunk(chunk);

                world.add(replacement);
                chunks[i] = replacement;
            }
        }
    }

    world.userData.update = update;
    world.userData.chunks = chunks;
    world.userData.chunkLength = LENGTH;

    return world;
}
