import * as THREE from "three";
import { buildRoad } from "./road.js";
import {
    isCairoChunk,
    createCairoBuildings,
    removeCairoBuildings
} from "./cities/cairo.js";
import { loadBuildingModels } from "./buildings.js";

// =====================================================
// MASHWAR - طريق مصري مفتوح
// تصميم واقعي مبسط: معالم قليلة ومتباعدة، بلا ظلال
// =====================================================

const C = {
    asphalt: 0x303438,
    asphaltEdge: 0x45494b,
    shoulder: 0x77746d,
    concrete: 0xaaa69e,
    white: 0xe8e6df,
    yellow: 0xe7bd48,
    sand: 0xc9b18a,
    soil: 0x92764e,
    grass: 0x547440,
    crop: 0x71864a,
    building: 0xbeb09a,
    buildingLight: 0xd0c2aa,
    plaster: 0xd8cbb7,
    glass: 0x385967,
    dark: 0x303437,
    metal: 0x747d82,
    red: 0x9c3d32,
    water: 0x477f91,
    bulb: 0xffe2a3
};

const MATERIALS = {};
for (const [key, color] of Object.entries(C)) {
    MATERIALS[key] = new THREE.MeshStandardMaterial({
        color,
        roughness: key === "glass" ? 0.32 : 0.88,
        metalness: key === "metal" ? 0.48 : 0
    });
}

// الهندسات المشتركة: لا ننشئ BoxGeometry جديدًا لكل تفصيلة
const GEOMETRIES = new Map();

function boxGeometry(w, h, d) {
    const key = `b:${w.toFixed(3)}:${h.toFixed(3)}:${d.toFixed(3)}`;
    if (!GEOMETRIES.has(key)) {
        GEOMETRIES.set(key, new THREE.BoxGeometry(w, h, d));
    }
    return GEOMETRIES.get(key);
}

function cylinderGeometry(r1, r2, h, segments = 10) {
    const key = `c:${r1}:${r2}:${h}:${segments}`;
    if (!GEOMETRIES.has(key)) {
        GEOMETRIES.set(key, new THREE.CylinderGeometry(r1, r2, h, segments));
    }
    return GEOMETRIES.get(key);
}

function planeGeometry(w, h) {
    const key = `p:${w}:${h}`;
    if (!GEOMETRIES.has(key)) {
        GEOMETRIES.set(key, new THREE.PlaneGeometry(w, h));
    }
    return GEOMETRIES.get(key);
}

function sphereGeometry(w = 12, h = 8) {
    const key = `s:${w}:${h}`;
    if (!GEOMETRIES.has(key)) {
        GEOMETRIES.set(key, new THREE.SphereGeometry(1, w, h));
    }
    return GEOMETRIES.get(key);
}

const LENGTH = 180;
const CHUNK_COUNT = 9;
const ROAD_HALF = 10.8;
// حالة تحميل مجسمات المباني
let buildingModelsReady = false;

function rng(seed) {
    let n = seed >>> 0;
    return () => {
        n = (n * 1664525 + 1013904223) >>> 0;
        return n / 4294967296;
    };
}

function addBox(parent, x, y, z, w, h, d, material, options = {}) {
    const mesh = new THREE.Mesh(boxGeometry(w, h, d), material);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    if (options.rotationY) mesh.rotation.y = options.rotationY;
    parent.add(mesh);
    return mesh;
}

function addCylinder(parent, x, y, z, radius, height, material, segments = 10) {
    const mesh = new THREE.Mesh(
        cylinderGeometry(radius, radius * 1.12, height, segments),
        material
    );
    mesh.position.set(x, y + height / 2, z);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    parent.add(mesh);
    return mesh;
}

function addTextBoard(parent, x, y, z, width, height, label, color = "#17543d") {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 512, 160);
    ctx.strokeStyle = "#e9e5d9";
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 500, 148);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 54px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";
    ctx.fillText(label, 256, 80, 470);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide
    });

    const board = new THREE.Mesh(
        planeGeometry(width, height),
        material
    );
    board.position.set(x, y, z);
    board.castShadow = false;
    board.receiveShadow = false;
    parent.add(board);
    return board;
}


// منزل مصري بسيط بتفاصيل قليلة وخامات طبيعية
function createHouse(parent, side, z, random, village = false) {
    const depth = village ? 7 : 9;
    const width = village ? 9 : 11;
    const floors = village ? 1 + Math.floor(random() * 2) : 2 + Math.floor(random() * 2);
    const height = floors * 3.1;
    const x = side * (22 + depth / 2);
    const bodyMaterial = random() > 0.5 ? MATERIALS.building : MATERIALS.buildingLight;

    addBox(parent, x, 0, z, depth, height, width, bodyMaterial);
    addBox(parent, x, height, z, depth + 0.25, 0.18, width + 0.25, MATERIALS.concrete);

    // واجهة الطريق في الجانب الداخلي الصحيح للمبنى
    const facadeX = x - side * (depth / 2 + 0.035);
    const windows = village ? 2 : 3;

    for (let floor = 0; floor < floors; floor++) {
        for (let col = 0; col < windows; col++) {
            const wz = z - width / 2 + 2 + col * ((width - 3) / Math.max(1, windows - 1));
            const wy = floor * 3.1 + 1.0;

            addBox(parent, facadeX, wy, wz, 0.09, 1.15, 1.0, MATERIALS.plaster);
            addBox(parent, facadeX - side * 0.06, wy + 0.04, wz, 0.035, 0.92, 0.76, MATERIALS.glass);

            if (!village && random() > 0.72) {
                addBox(parent, facadeX - side * 0.38, wy - 0.5, wz, 0.75, 0.1, 1.25, MATERIALS.concrete);
            }
        }
    }

    addBox(parent, facadeX - side * 0.07, 0, z + width * 0.28, 0.12, 2.2, 1.05, MATERIALS.dark);

    // خزان واحد صغير على السطح في بعض المباني فقط
    if (random() > 0.48) {
        addCylinder(parent, x, height + 0.18, z - width * 0.22, 0.55, 1.0, MATERIALS.metal, 12);
    }
}

function createShop(parent, side, z, random) {
    const depth = 7;
    const width = 8;
    const x = side * (22 + depth / 2);
    addBox(parent, x, 0, z, depth, 3.8, width, MATERIALS.buildingLight);

    const facadeX = x - side * (depth / 2 + 0.08);
    addBox(parent, facadeX, 0.2, z, 0.12, 2.45, width - 0.7, MATERIALS.glass);
    addBox(parent, facadeX - side * 0.08, 2.85, z, 0.18, 0.65, width + 0.3, MATERIALS.red);

    const names = ["بقالة", "ماركت", "مطعم", "قطع غيار"];
    const sign = addTextBoard(parent, facadeX - side * 0.12, 3.35, z, width - 0.4, 0.7,
        names[Math.floor(random() * names.length)], "#234b5b");
    sign.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
}

function createPalm(parent, x, z, random) {
    const height = 5.5 + random() * 1.4;
    addCylinder(parent, x, 0, z, 0.22, height, MATERIALS.soil, 8);

    const leaf = new THREE.Mesh(
        boxGeometry(0.42, 0.11, 3.6),
        MATERIALS.grass
    );
    for (let i = 0; i < 7; i++) {
        const angle = i * Math.PI * 2 / 7;
        const frond = new THREE.Mesh(leaf.geometry, leaf.material);
        frond.position.set(x + Math.sin(angle) * 1.05, height, z + Math.cos(angle) * 1.05);
        frond.rotation.y = angle;
        frond.rotation.x = -0.2;
        parent.add(frond);
    }
}

function createFarm(parent, side, z, random) {
    const x = side * (34 + random() * 8);
    addBox(parent, x, 0, z, 27, 0.06, 34, MATERIALS.grass);

    // صفوف زراعية قليلة بدل شبكة كثيفة
    for (let row = 0; row < 4; row++) {
        addBox(parent, x - 10 + row * 6.5, 0.07, z, 0.16, 0.035, 29, MATERIALS.soil);
    }

    if (random() > 0.35) createPalm(parent, x + side * 8, z - 8, random);
    if (random() > 0.55) createPalm(parent, x - side * 7, z + 9, random);

    addBox(parent, side * 18, 0.035, z, 1.3, 0.05, 30, MATERIALS.water);
}

function createDesert(parent, side, z, random) {
    // كثيبان أو ثلاثة بعيدًا عن الطريق، وليس تلالًا كثيرة
    for (let i = 0; i < 2; i++) {
        const hill = new THREE.Mesh(sphereGeometry(12, 8), MATERIALS.sand);
        const sx = 12 + random() * 12;
        const sy = 2.5 + random() * 2.5;
        const sz = 18 + random() * 15;
        hill.scale.set(sx, sy, sz);
        hill.position.set(side * (38 + random() * 24), sy * 0.4 - 0.1, z + (i ? 38 : -38));
        hill.castShadow = false;
        hill.receiveShadow = false;
        parent.add(hill);
    }
}

// إنارة شكلية فقط، بدون PointLight
function createStreetLight(parent, side, z) {
    const x = side * 20.5;
    const inward = -side;

    addCylinder(parent, x, 0, z, 0.09, 7.5, MATERIALS.metal, 8);

    const arm = new THREE.Mesh(
        boxGeometry(1.8, 0.12, 0.12),
        MATERIALS.metal
    );

    arm.position.set(x + inward * 0.75, 7.45, z);
    parent.add(arm);

    const lamp = new THREE.Mesh(
        boxGeometry(0.72, 0.18, 0.38),
        MATERIALS.dark
    );

    lamp.position.set(x + inward * 1.45, 7.32, z);
    parent.add(lamp);

    const bulb = new THREE.Mesh(
        boxGeometry(0.52, 0.035, 0.24),
        MATERIALS.bulb
    );

    bulb.position.set(lamp.position.x, 7.21, z);
    parent.add(bulb);
}

function createGuardRail(parent, side) {
    const x = side * 19.1;

    addBox(parent, x, 0.72, 0, 0.12, 0.16, LENGTH, MATERIALS.metal);

    const posts = new THREE.InstancedMesh(
        cylinderGeometry(0.05, 0.06, 0.78, 6),
        MATERIALS.metal,
        6
    );

    const dummy = new THREE.Object3D();

    for (let i = 0; i < 6; i++) {
        dummy.position.set(x, 0.39, -72 + i * 28);
        dummy.updateMatrix();
        posts.setMatrixAt(i, dummy.matrix);
    }

    posts.instanceMatrix.needsUpdate = true;
    parent.add(posts);
}
function createRoadSign(parent, side, z, label) {
    const x = side * 22.5;

    addCylinder(parent, x, 0, z, 0.075, 3.6, MATERIALS.metal, 8);

    const board = addTextBoard(
        parent,
        x - side * 0.08,
        3.8,
        z,
        4.5,
        1.35,
        label
    );

    board.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
}
// تنظيف القطعة فقط؛ الخامات والهندسات المشتركة تظل محفوظة
function disposeChunk(chunk) {
    const textures = new Set();

    chunk.traverse(object => {
        if (!object.isMesh || !object.material) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
            if (!material) continue;
            for (const value of Object.values(material)) {
                if (value && value.isTexture) textures.add(value);
            }
            // مواد اللوحات فقط محلية وليست من MATERIALS
            if (material.map) {
                material.map.dispose();
                material.dispose();
            }
        }
    });

    textures.clear();
}

// إنشاء قطعة طريق واحدة
function createChunk(index) {
    const chunk = new THREE.Group();
    const random = rng(index + 72531);
    chunk.name = `MASHWAR_CHUNK_${index}`;
    chunk.userData.chunkIndex = index;

    buildRoad(chunk);

    const phase = ((index % 16) + 16) % 16;
    const zone = phase < 4 ? "urban" : phase < 8 ? "farm" : phase < 12 ? "desert" : "upper";
    chunk.userData.zone = zone;

    // أعمدة إنارة قليلة ومتباعدة، عمودان فقط لكل قطعة
    if (index % 2 === 0) {
        createStreetLight(chunk, -1, -42);
        createStreetLight(chunk, 1, 42);
    }

    // البيئة متباعدة: معلم أو اثنان في القطعة، ومساحات مفتوحة واسعة
    if (zone === "urban") {
        if (index % 2 === 0) createHouse(chunk, -1, -35, random, false);
        if (index % 3 === 0) createShop(chunk, 1, 42, random);
    } else if (zone === "farm") {
        createFarm(chunk, index % 2 === 0 ? -1 : 1, index % 2 === 0 ? 18 : -18, random);
        if (index % 3 === 0) createHouse(chunk, 1, 48, random, true);
    } else if (zone === "desert") {
        createDesert(chunk, -1, 0, random);
        createDesert(chunk, 1, 0, random);
    } else {
        createFarm(chunk, -1, -28, random);
        if (index % 2 === 0) createHouse(chunk, 1, 38, random, true);
    }

    const destinations = {
        urban: "القاهرة",
        farm: "المنيا",
        desert: "طريق الصعيد",
        upper: "أسيوط"
    };

    if (index % 3 === 0) {
        createRoadSign(chunk, 1, 55, destinations[zone]);
    }

    // الحواجز في أجزاء محددة فقط، حتى لا يبدو الطريق محاطًا دائمًا
    if (index % 3 !== 1) {
        createGuardRail(chunk, -1);
        createGuardRail(chunk, 1);
    }

    return chunk;
}

// العالم المفتوح بإعادة تدوير القطع
export function createEgyptianCity(scene) {
    const world = new THREE.Group();
    world.name = "MASHWAR_ENDLESS_HIGHWAY";
    scene.add(world);

    const chunks = [];
    const half = Math.floor(CHUNK_COUNT / 2);

    for (let i = -half; i <= half; i++) {
        const chunk = createChunk(i);
        chunk.position.z = i * LENGTH;
        world.add(chunk);
        chunks.push(chunk);
    }

    let furthestZ = half * LENGTH;

    function update(_delta = 0.016, playerZ = 0, _night = false) {
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const end = chunk.position.z + LENGTH / 2;

            if (end < playerZ - LENGTH) {
                const nextIndex = chunk.userData.chunkIndex + CHUNK_COUNT;
                const nextZ = furthestZ + LENGTH;

                world.remove(chunk);
                disposeChunk(chunk);

                const replacement = createChunk(nextIndex);
                replacement.position.z = nextZ;
                world.add(replacement);
                chunks[i] = replacement;
                furthestZ = nextZ;
            }
        }
    }

    world.userData.update = update;
    world.userData.chunks = chunks;
    world.userData.chunkLength = LENGTH;
    return world;
}
