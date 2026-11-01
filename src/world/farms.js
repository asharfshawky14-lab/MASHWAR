import * as THREE from "three";

// =====================================================
// MASHWAR - الأراضي الزراعية المصرية
// أول مرحلة: حقول قمح واسعة على جانبي الطريق
// =====================================================

const FIELD = {
    length: 180,
    startX: 25,
    width: 48,
    rowSpacing: 1.75,
    plantSpacing: 4.7,
    rowsPerSide: 25,
    plantsPerRow: 37
};

const materials = {
    soil: new THREE.MeshStandardMaterial({
        color: 0x80613e,
        roughness: 1
    }),
    furrow: new THREE.MeshStandardMaterial({
        color: 0x604a32,
        roughness: 1
    }),
    wheat: new THREE.MeshStandardMaterial({
        color: 0xb58b37,
        roughness: 0.92,
        side: THREE.DoubleSide
    })
};

const fieldGeometry = new THREE.BoxGeometry(
    FIELD.width,
    0.16,
    FIELD.length
);

const furrowGeometry = new THREE.BoxGeometry(
    0.13,
    0.035,
    FIELD.length - 4
);

function seededRandom(seed) {
    let value = seed >>> 0;

    return function random() {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 4294967296;
    };
}

function addTriangle(positions, a, b, c) {
    positions.push(
        a[0], a[1], a[2],
        b[0], b[1], b[2],
        c[0], c[1], c[2]
    );
}

function addQuad(positions, a, b, c, d) {
    addTriangle(positions, a, b, c);
    addTriangle(positions, a, c, d);
}

function addStem(positions, bottom, top, radius, segments = 6) {
    for (let i = 0; i < segments; i++) {
        const a1 = (i / segments) * Math.PI * 2;
        const a2 = ((i + 1) / segments) * Math.PI * 2;

        const p1 = [
            bottom[0] + Math.cos(a1) * radius,
            bottom[1],
            bottom[2] + Math.sin(a1) * radius
        ];

        const p2 = [
            bottom[0] + Math.cos(a2) * radius,
            bottom[1],
            bottom[2] + Math.sin(a2) * radius
        ];

        const p3 = [
            top[0] + Math.cos(a2) * radius * 0.55,
            top[1],
            top[2] + Math.sin(a2) * radius * 0.55
        ];

        const p4 = [
            top[0] + Math.cos(a1) * radius * 0.55,
            top[1],
            top[2] + Math.sin(a1) * radius * 0.55
        ];

        addQuad(positions, p1, p2, p3, p4);
    }
}

function addLeaf(positions, start, direction, length, width) {
    const end = [
        start[0] + direction[0] * length,
        start[1] + length * 0.34,
        start[2] + direction[1] * length
    ];

    const middle = [
        (start[0] + end[0]) * 0.5 + direction[0] * 0.12,
        start[1] + length * 0.18,
        (start[2] + end[2]) * 0.5 + direction[1] * 0.12
    ];

    const sideX = -direction[1] * width;
    const sideZ = direction[0] * width;

    const a = [start[0], start[1], start[2]];
    const b = [middle[0] + sideX, middle[1], middle[2] + sideZ];
    const c = [end[0], end[1], end[2]];
    const d = [middle[0] - sideX, middle[1], middle[2] - sideZ];

    addQuad(positions, a, b, c, d);
}

function addKernel(positions, x, y, z, radius, height) {
    const top = [x, y + height, z];
    const bottom = [x, y - height, z];

    const ring = [
        [x + radius, y, z],
        [x, y, z + radius],
        [x - radius, y, z],
        [x, y, z - radius]
    ];

    for (let i = 0; i < ring.length; i++) {
        const next = ring[(i + 1) % ring.length];

        addTriangle(positions, top, ring[i], next);
        addTriangle(positions, bottom, next, ring[i]);
    }
}

function createWheatGeometry() {
    const positions = [];

    addStem(
        positions,
        [0, 0, 0],
        [0.035, 0.91, 0],
        0.027,
        7
    );

    const leaves = [
        { y: 0.22, angle: 0.2, length: 0.48 },
        { y: 0.36, angle: 2.1, length: 0.43 },
        { y: 0.49, angle: 3.8, length: 0.39 },
        { y: 0.61, angle: 5.3, length: 0.32 }
    ];

    for (const leaf of leaves) {
        addLeaf(
            positions,
            [0, leaf.y, 0],
            [Math.cos(leaf.angle), Math.sin(leaf.angle)],
            leaf.length,
            0.045
        );
    }

    addStem(
        positions,
        [0.035, 0.86, 0],
        [0.045, 1.22, 0],
        0.018,
        6
    );

    for (let row = 0; row < 6; row++) {
        const y = 0.91 + row * 0.047;
        const spread = 0.035 + row * 0.004;

        addKernel(positions, -spread, y, 0, 0.025, 0.035);
        addKernel(positions, spread, y + 0.018, 0, 0.025, 0.035);
    }

    for (let i = 0; i < 3; i++) {
        const x = (i - 1) * 0.018;

        addStem(
            positions,
            [0.045, 1.17, 0],
            [x, 1.34 + i * 0.015, 0],
            0.006,
            4
        );
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
    );

    geometry.computeVertexNormals();

    return geometry;
}

const wheatGeometry = createWheatGeometry();
const dummy = new THREE.Object3D();

function createFieldGround(parent, centerX) {
    const ground = new THREE.Mesh(
        fieldGeometry,
        materials.soil
    );

    ground.position.set(centerX, -0.015, 0);
    ground.receiveShadow = false;
    ground.castShadow = false;

    parent.add(ground);

    const furrows = new THREE.InstancedMesh(
        furrowGeometry,
        materials.furrow,
        FIELD.rowsPerSide
    );

    for (let row = 0; row < FIELD.rowsPerSide; row++) {
        const localX =
            -FIELD.width / 2 + 1.5 + row * FIELD.rowSpacing;

        dummy.position.set(
            centerX + localX,
            0.075,
            0
        );

        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();

        furrows.setMatrixAt(row, dummy.matrix);
    }

    furrows.instanceMatrix.needsUpdate = true;
    furrows.castShadow = false;
    furrows.receiveShadow = false;

    parent.add(furrows);
}

function createWheatPlants(parent, random, centers) {
    const totalPlants =
        centers.length *
        FIELD.rowsPerSide *
        FIELD.plantsPerRow;

    const plants = new THREE.InstancedMesh(
        wheatGeometry,
        materials.wheat,
        totalPlants
    );

    plants.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    let index = 0;

    for (const centerX of centers) {
        for (let row = 0; row < FIELD.rowsPerSide; row++) {
            const rowX =
                -FIELD.width / 2 + 1.5 + row * FIELD.rowSpacing;

            for (let plant = 0; plant < FIELD.plantsPerRow; plant++) {
                const z =
                    -FIELD.length / 2 + 5 +
                    plant * FIELD.plantSpacing +
                    (random() - 0.5) * 0.75;

                const x =
                    centerX + rowX + (random() - 0.5) * 0.28;

                const height = 0.82 + random() * 0.48;
                const width = 0.82 + random() * 0.28;

                dummy.position.set(x, 0.08, z);

                dummy.rotation.set(
                    (random() - 0.5) * 0.12,
                    random() * Math.PI * 2,
                    (random() - 0.5) * 0.12
                );

                dummy.scale.set(width, height, width);
                dummy.updateMatrix();

                plants.setMatrixAt(index++, dummy.matrix);
            }
        }
    }

    plants.instanceMatrix.needsUpdate = true;
    plants.frustumCulled = true;
    plants.castShadow = false;
    plants.receiveShadow = false;

    parent.add(plants);
}

export function createFarms(parent, chunkIndex = 0) {
    const farms = new THREE.Group();

    farms.name = `MASHWAR_FARMS_${chunkIndex}`;

    const random = seededRandom(chunkIndex + 918273);

    const centerOffset = FIELD.startX + FIELD.width / 2;
    const centers = [-centerOffset, centerOffset];

    for (const side of [-1, 1]) {
        createFieldGround(
            farms,
            side * centerOffset
        );
    }

    createWheatPlants(farms, random, centers);

    parent.add(farms);

    return farms;
}
