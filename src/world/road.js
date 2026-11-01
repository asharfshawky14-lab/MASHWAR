
import * as THREE from "three";

// =====================================================
// MASHWAR - نظام الطريق السريع
// 8 حارات: 4 ذهاب + 4 عودة
// فاصل خرساني وسطي - بدون ظلال
// =====================================================

const ROAD = {
    length: 180,

    laneWidth: 3.5,
    lanesPerSide: 4,

    medianWidth: 3.2,
    shoulderWidth: 2.2,

    asphaltY: 0.02,
    asphaltHeight: 0.22,

    dashLength: 6,
    dashGap: 6,

    asphaltColor: 0x343638,
    shoulderColor: 0x555657,
    groundColor: 0xc9b18a,

    lineColor: 0xe9e7df,
    medianColor: 0x92918c,
    reflectorColor: 0xe8c34c,
    metalColor: 0x777d80
};

const materials = {
    asphalt: new THREE.MeshStandardMaterial({
        color: ROAD.asphaltColor,
        roughness: 0.96
    }),

    shoulder: new THREE.MeshStandardMaterial({
        color: ROAD.shoulderColor,
        roughness: 0.95
    }),

    ground: new THREE.MeshStandardMaterial({
        color: ROAD.groundColor,
        roughness: 1
    }),

    line: new THREE.MeshBasicMaterial({
        color: ROAD.lineColor
    }),

    median: new THREE.MeshStandardMaterial({
        color: ROAD.medianColor,
        roughness: 0.9
    }),

    reflector: new THREE.MeshBasicMaterial({
        color: ROAD.reflectorColor
    }),

    metal: new THREE.MeshStandardMaterial({
        color: ROAD.metalColor,
        metalness: 0.35,
        roughness: 0.8
    })
};

const geometries = {
    ground: new THREE.BoxGeometry(150, 0.6, ROAD.length),

    asphalt: new THREE.BoxGeometry(
        ROAD.laneWidth * ROAD.lanesPerSide,
        ROAD.asphaltHeight,
        ROAD.length
    ),

    shoulder: new THREE.BoxGeometry(
        ROAD.shoulderWidth,
        0.18,
        ROAD.length
    ),

    line: new THREE.BoxGeometry(0.13, 0.035, ROAD.dashLength),

    solidLine: new THREE.BoxGeometry(0.16, 0.035, ROAD.length),

    medianBase: new THREE.BoxGeometry(
        ROAD.medianWidth,
        0.35,
        ROAD.length
    ),

    medianBarrier: new THREE.BoxGeometry(
        0.55,
        0.8,
        ROAD.length
    ),

    reflector: new THREE.BoxGeometry(0.24, 0.08, 0.45),

    rail: new THREE.BoxGeometry(0.12, 0.15, ROAD.length)
};

function addMesh(parent, geometry, material, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(x, y, z);

    mesh.castShadow = false;
    mesh.receiveShadow = false;

    parent.add(mesh);

    return mesh;
}

// =====================================================
// الأرض أسفل الطريق
// =====================================================

function buildGround(parent) {
    addMesh(
        parent,
        geometries.ground,
        materials.ground,
        0,
        -0.30,
        0
    );
}

// =====================================================
// الأسفلت: اتجاهان منفصلان
// =====================================================

function buildAsphalt(parent) {
    const directionWidth = ROAD.laneWidth * ROAD.lanesPerSide;

    const centerDistance =
        ROAD.medianWidth / 2 + directionWidth / 2;

    for (const side of [-1, 1]) {
        const centerX = side * centerDistance;

        addMesh(
            parent,
            geometries.asphalt,
            materials.asphalt,
            centerX,
            ROAD.asphaltY + ROAD.asphaltHeight / 2,
            0
        );

        const shoulderX =
            side * (
                ROAD.medianWidth / 2 +
                directionWidth +
                ROAD.shoulderWidth / 2
            );

        addMesh(
            parent,
            geometries.shoulder,
            materials.shoulder,
            shoulderX,
            0.09,
            0
        );
    }
}

// =====================================================
// خطوط الحارات
// 3 خطوط متقطعة داخل كل اتجاه
// =====================================================

function buildLaneLines(parent) {
    const dummy = new THREE.Object3D();

    const directionWidth = ROAD.laneWidth * ROAD.lanesPerSide;

    const centerDistance =
        ROAD.medianWidth / 2 + directionWidth / 2;

    const count = Math.floor(
        ROAD.length / (ROAD.dashLength + ROAD.dashGap)
    );

    for (const side of [-1, 1]) {
        const centerX = side * centerDistance;

        for (let lane = 1; lane < ROAD.lanesPerSide; lane++) {
            const x =
                centerX +
                side * (
                    -directionWidth / 2 +
                    lane * ROAD.laneWidth
                );

            const dashes = new THREE.InstancedMesh(
                geometries.line,
                materials.line,
                count
            );

            for (let i = 0; i < count; i++) {
                const z =
                    -ROAD.length / 2 +
                    ROAD.dashLength / 2 +
                    i * (ROAD.dashLength + ROAD.dashGap);

                dummy.position.set(x, 0.145, z);
                dummy.updateMatrix();

                dashes.setMatrixAt(i, dummy.matrix);
            }

            dashes.instanceMatrix.needsUpdate = true;

            dashes.castShadow = false;
            dashes.receiveShadow = false;

            parent.add(dashes);
        }
    }
}

// =====================================================
// الخطوط الخارجية والداخلية
// =====================================================

function buildRoadEdges(parent) {
    const directionWidth = ROAD.laneWidth * ROAD.lanesPerSide;

    const innerEdge = ROAD.medianWidth / 2;
    const outerEdge = ROAD.medianWidth / 2 + directionWidth;

    for (const side of [-1, 1]) {
        addMesh(
            parent,
            geometries.solidLine,
            materials.line,
            side * innerEdge,
            0.145,
            0
        );

        addMesh(
            parent,
            geometries.solidLine,
            materials.line,
            side * outerEdge,
            0.145,
            0
        );
    }
}

// =====================================================
// الفاصل الخرساني في منتصف الطريق
// =====================================================

function buildMedian(parent) {
    addMesh(
        parent,
        geometries.medianBase,
        materials.median,
        0,
        0.195,
        0
    );

    addMesh(
        parent,
        geometries.medianBarrier,
        materials.median,
        0,
        0.76,
        0
    );

    const count = 12;
    const reflectors = new THREE.InstancedMesh(
        geometries.reflector,
        materials.reflector,
        count
    );

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
        const z =
            -ROAD.length / 2 + 8 + i * 14;

        dummy.position.set(0, 1.18, z);
        dummy.updateMatrix();

        reflectors.setMatrixAt(i, dummy.matrix);
    }

    reflectors.instanceMatrix.needsUpdate = true;

    reflectors.castShadow = false;
    reflectors.receiveShadow = false;

    parent.add(reflectors);
}

// =====================================================
// عواكس جانبية
// =====================================================

function buildSideReflectors(parent) {
    const directionWidth = ROAD.laneWidth * ROAD.lanesPerSide;

    const outerEdge =
        ROAD.medianWidth / 2 +
        directionWidth +
        ROAD.shoulderWidth;

    const count = 12;
    const dummy = new THREE.Object3D();

    for (const side of [-1, 1]) {
        const reflectors = new THREE.InstancedMesh(
            geometries.reflector,
            materials.reflector,
            count
        );

        for (let i = 0; i < count; i++) {
            const z =
                -ROAD.length / 2 + 8 + i * 14;

            dummy.position.set(
                side * (outerEdge - 0.25),
                0.22,
                z
            );

            dummy.updateMatrix();

            reflectors.setMatrixAt(i, dummy.matrix);
        }

        reflectors.instanceMatrix.needsUpdate = true;

        parent.add(reflectors);
    }
}

// =====================================================
// إنشاء الطريق الكامل
// =====================================================

export function buildRoad(parent) {
    buildGround(parent);
    buildAsphalt(parent);
    buildLaneLines(parent);
    buildRoadEdges(parent);
    buildMedian(parent);
    buildSideReflectors(parent);

    parent.userData.roadWidth =
        ROAD.medianWidth +
        2 * (
            ROAD.laneWidth * ROAD.lanesPerSide +
            ROAD.shoulderWidth
        );

    parent.userData.lanesPerDirection = 4;
    parent.userData.totalLanes = 8;

    return parent;
}
