
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// =====================================================
// MASHWAR - BUILDING SYSTEM
// تحميل وإدارة مجسمات المباني الأصلية
// =====================================================

const MODEL_PATHS = [
    new URL("../../assets/models/buildings/brownstone-row-house-1b84fd.glb", import.meta.url).href,
    new URL("../../assets/models/buildings/cast-iron-loft-b04b5a.glb", import.meta.url).href,
    new URL("../../assets/models/buildings/corner-tenement-92fb62.glb", import.meta.url).href
];

const BUILDING_COLORS = [
    0xd5c5a9,
    0xc8bba8,
    0xe0d6c5,
    0xb9b5aa,
    0xd1b99b,
    0xc4c9c5,
    0xbda995,
    0xe2d9ca
];

const HEIGHT_VARIATIONS = [0.88, 0.96, 1.00, 1.08, 1.16];

const loader = new GLTFLoader();

let modelsPromise = null;
let buildingTemplates = [];

function createRandom(seed = 1) {
    let value = seed >>> 0;

    return function () {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 4294967296;
    };
}

// تحميل النماذج مرة واحدة
export function loadBuildingModels() {
    if (modelsPromise) return modelsPromise;

    modelsPromise = Promise.all(
        MODEL_PATHS.map(path => loader.loadAsync(path))
    )
    .then(gltfs => {
        buildingTemplates = gltfs.map((gltf, index) => {
            const template = gltf.scene.clone(true);

            template.name = `MASHWAR_BUILDING_TEMPLATE_${index}`;

            template.traverse(object => {
                if (!object.isMesh) return;

                object.castShadow = false;
                object.receiveShadow = false;

                if (Array.isArray(object.material)) {
                    object.material = object.material.map(material => material.clone());
                } else if (object.material) {
                    object.material = object.material.clone();
                }
            });

            return template;
        });

        return buildingTemplates;
    })
    .catch(error => {
        modelsPromise = null;
        console.error("MASHWAR: Building models loading failed:", error);
        throw error;
    });

    return modelsPromise;
}

function getModelDimensions(model) {
    model.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());

    if (size.x <= 0 || size.y <= 0 || size.z <= 0) {
        throw new Error("Invalid building model dimensions");
    }

    return {
        bounds,
        width: size.x,
        height: size.y,
        depth: size.z,
        center: bounds.getCenter(new THREE.Vector3())
    };
}

function createBuildingInstance(modelIndex, options, random) {
    const template = buildingTemplates[modelIndex];

    if (!template) {
        throw new Error(`Building model ${modelIndex} is not loaded`);
    }

    const building = template.clone(true);
    const dimensions = getModelDimensions(building);

    const heightFactor =
        HEIGHT_VARIATIONS[
            Math.floor(random() * HEIGHT_VARIATIONS.length)
        ];

    const targetHeight = (options.height ?? 12) * heightFactor;
    const targetWidth = options.width ?? 10;
    const targetDepth = options.depth ?? 8;

    building.scale.set(
        targetWidth / dimensions.width,
        targetHeight / dimensions.height,
        targetDepth / dimensions.depth
    );

    // توحيد نقطة ارتكاز المبنى عند مستوى الأرض
    building.position.set(
        -dimensions.center.x * building.scale.x,
        -dimensions.bounds.min.y * building.scale.y,
        -dimensions.center.z * building.scale.z
    );

    const color = BUILDING_COLORS[
        Math.floor(random() * BUILDING_COLORS.length)
    ];

    building.traverse(object => {
        if (!object.isMesh || !object.material) return;

        const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

        for (const material of materials) {
            if (material.color) material.color.setHex(color);

            material.roughness = 0.88;
            material.metalness = 0;
            material.needsUpdate = true;
        }

        object.castShadow = false;
        object.receiveShadow = false;
    });

    building.userData.modelIndex = modelIndex;
    building.userData.buildingColor = color;

    return building;
}

// إنشاء صف مبانٍ
export function createBuildingRow(parent, options = {}) {
    if (buildingTemplates.length !== MODEL_PATHS.length) {
        throw new Error("Building models are not loaded yet");
    }

    const side = options.side === -1 ? -1 : 1;
    const startZ = options.startZ ?? -70;
    const count = options.count ?? 5;
    const roadEdge = options.roadEdge ?? 17.7;
    const spacing = options.spacing ?? 0.45;

    const random = createRandom(options.seed ?? 2026);

    const row = new THREE.Group();

    row.name = side < 0
        ? "MASHWAR_BUILDINGS_LEFT"
        : "MASHWAR_BUILDINGS_RIGHT";

    let currentZ = startZ;

    for (let i = 0; i < count; i++) {
        const modelIndex = Math.floor(
            random() * buildingTemplates.length
        );

        const width = 9 + random() * 2.5;
        const depth = 7 + random() * 2;

        const building = createBuildingInstance(
            modelIndex,
            {
                width,
                depth,
                height: 10 + random() * 5
            },
            random
        );

        // قيمة الدوران قابلة للتحديد بعد التحقق من اتجاه واجهة المجسم
        building.rotation.y = options.facadeRotation ?? 0;

        building.position.x =
            side * (roadEdge + depth / 2 + 1.2);

        building.position.z = currentZ;

        row.add(building);

        currentZ += width + spacing;
    }

    parent.add(row);

    return row;
}

// تنظيف الصف عند إزالة قطعة العالم
export function disposeBuildingRow(row) {
    if (!row) return;

    row.traverse(object => {
        if (!object.isMesh || !object.material) return;

        const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

        for (const material of materials) {
            material.dispose();
        }
    });

    row.removeFromParent();
}
