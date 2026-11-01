
import * as THREE from "three";

/*
 * MASHWAR
 * Egyptian City Environment
 * Main city construction module
 */

export function createEgyptianCity(scene) {
    const city = new THREE.Group();
    city.name = "MASHWAR_EGYPTIAN_CITY";

    const materials = createMaterials();

    // Build the complete city
    createGround(city, materials);
    createMainRoad(city, materials);
    createSideRoads(city, materials);
    createSidewalks(city, materials);
    createRoadMarkings(city, materials);
    createCityBuildings(city, materials);
    createStreetLights(city, materials);
    createTrafficSigns(city, materials);
    createTrafficLights(city, materials);
    createStreetDetails(city, materials);

    scene.add(city);

    return city;
}

// ========================================
// MATERIALS
// ========================================

function createMaterials() {
    return {
        ground: new THREE.MeshStandardMaterial({
            color: 0x9b947f,
            roughness: 1
        }),

        asphalt: new THREE.MeshStandardMaterial({
            color: 0x303234,
            roughness: 0.96
        }),

        sidewalk: new THREE.MeshStandardMaterial({
            color: 0xaaa69c,
            roughness: 0.95
        }),

        curb: new THREE.MeshStandardMaterial({
            color: 0xd7d0c1
        }),

        white: new THREE.MeshStandardMaterial({
            color: 0xf2eee3
        }),

        yellow: new THREE.MeshStandardMaterial({
            color: 0xe9b72e
        }),

        concrete: new THREE.MeshStandardMaterial({
            color: 0xc7bca8,
            roughness: 0.95
        }),

        oldConcrete: new THREE.MeshStandardMaterial({
            color: 0x9c927e,
            roughness: 1
        }),

        glass: new THREE.MeshStandardMaterial({
            color: 0x557b8b,
            metalness: 0.45,
            roughness: 0.18
        }),

        darkGlass: new THREE.MeshStandardMaterial({
            color: 0x253b46,
            metalness: 0.4,
            roughness: 0.22
        }),

        metal: new THREE.MeshStandardMaterial({
            color: 0x343a3e,
            metalness: 0.75,
            roughness: 0.3
        }),

        lamp: new THREE.MeshStandardMaterial({
            color: 0xffe6a3,
            emissive: 0xffc45c,
            emissiveIntensity: 1.5
        }),

        red: new THREE.MeshStandardMaterial({
            color: 0xff2424,
            emissive: 0xaa0000,
            emissiveIntensity: 0.5
        }),

        green: new THREE.MeshStandardMaterial({
            color: 0x20e36a,
            emissive: 0x007a28,
            emissiveIntensity: 0.5
        }),

        orange: new THREE.MeshStandardMaterial({
            color: 0xffae24,
            emissive: 0x995000,
            emissiveIntensity: 0.5
        }),

        shopColors: [
            0xdbc6a6,
            0xb9b3a2,
            0xc6a58b,
            0xb5b9aa,
            0xd2c4a8
        ]
    };
}

// ========================================
// BASIC OBJECT HELPERS
// ========================================

function addBox(parent, x, y, z, w, h, d, material) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    parent.add(mesh);
    return mesh;
}

function addCylinder(
    parent,
    x, y, z,
    radiusTop,
    radiusBottom,
    height,
    material
) {
    const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(
            radiusTop,
            radiusBottom,
            height,
            12
        ),
        material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    parent.add(mesh);
    return mesh;
}

// ========================================
// GROUND
// ========================================

function createGround(city, materials) {
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(320, 320),
        materials.ground
    );

    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.12;
    ground.receiveShadow = true;

    city.add(ground);
}

// ========================================
// MAIN ROAD
// ========================================

function createMainRoad(city, materials) {
    addBox(
        city,
        0,
        0,
        0,
        18,
        0.12,
        260,
        materials.asphalt
    );

    // Road center line
    for (let z = -125; z < 130; z += 10) {
        addBox(
            city,
            0,
            0.075,
            z,
            0.16,
            0.025,
            4.5,
            materials.yellow
        );
    }

    // Road edges
    for (const x of [-8.7, 8.7]) {
        addBox(
            city,
            x,
            0.08,
            0,
            0.13,
            0.025,
            260,
            materials.white
        );
    }

    // Lane divider lines
    for (const x of [-4.5, 4.5]) {
        for (let z = -125; z < 130; z += 11) {
            addBox(
                city,
                x,
                0.08,
                z,
                0.10,
                0.025,
                5,
                materials.white
            );
        }
    }
}

// ========================================
// SIDE ROADS
// ========================================

function createSideRoads(city, materials) {
    const roadPositions = [-90, -30, 30, 90];

    for (const z of roadPositions) {
        addBox(
            city,
            0,
            0.01,
            z,
            260,
            0.12,
            12,
            materials.asphalt
        );

        // Side road markings
        for (let x = -125; x < 130; x += 14) {
            addBox(
                city,
                x,
                0.08,
                z,
                6,
                0.025,
                0.14,
                materials.white
            );
        }
    }
}

// ========================================
// SIDEWALKS
// ========================================

function createSidewalks(city, materials) {
    for (const side of [-1, 1]) {
        addBox(
            city,
            side * 10.2,
            0.12,
            0,
            2.3,
            0.32,
            260,
            materials.sidewalk
        );

        addBox(
            city,
            side * 11.35,
            0.13,
            0,
            0.18,
            0.35,
            260,
            materials.curb
        );

        for (let z = -125; z < 130; z += 5) {
            addBox(
                city,
                side * 10.2,
                0.285,
                z,
                2.25,
                0.025,
                0.08,
                materials.curb
            );
        }
    }
}

// ========================================
// ROAD MARKINGS
// ========================================

function createRoadMarkings(city, materials) {
    const crossings = [-90, -30, 30, 90];

    for (const z of crossings) {
        // Pedestrian crossings
        for (let x = -7; x <= 7; x += 1.4) {
            addBox(
                city,
                x,
                0.085,
                z + 8,
                0.85,
                0.025,
                3,
                materials.white
            );
        }

        // Stop lines
        for (const side of [-1, 1]) {
            addBox(
                city,
                side * 5,
                0.085,
                z + 13,
                5,
                0.025,
                0.18,
                materials.white
            );
        }
    }
}

// ========================================
// BUILDING CONSTRUCTION
// ========================================

function createCityBuildings(city, materials) {
    const positions = [];

    for (let z = -115; z <= 115; z += 29) {
        positions.push({
            x: -19,
            z: z,
            side: -1
        });

        positions.push({
            x: 19,
            z: z,
            side: 1
        });
    }

    positions.forEach((position, index) => {
        const building = createBuilding(
            position.side,
            materials,
            index
        );

        building.position.set(
            position.x,
            0,
            position.z
        );

        city.add(building);
    });
}

function createBuilding(side, materials, seed) {
    const building = new THREE.Group();

    const width = 25;
    const depth = 15;
    const floors = 3 + (seed % 3);
    const floorHeight = 3.5;
    const height = floors * floorHeight;

    const wallMaterial = new THREE.MeshStandardMaterial({
        color: materials.shopColors[
            seed % materials.shopColors.length
        ],
        roughness: 0.96
    });

    // Main building body
    addBox(
        building,
        0,
        height / 2,
        0,
        depth,
        height,
        width,
        wallMaterial
    );

    // Roof edge
    addBox(
        building,
        0,
        height + 0.18,
        0,
        depth + 0.35,
        0.35,
        width + 0.35,
        materials.concrete
    );

    // Roof water tank
    addCylinder(
        building,
        0,
        height + 1.1,
        0,
        0.8,
        0.8,
        1.5,
        materials.oldConcrete
    );

    // Rooftop water tank support
    addBox(
        building,
        0,
        height + 0.5,
        0,
        2.1,
        0.18,
        2.1,
        materials.metal
    );

    createBuildingFacade(
        building,
        side,
        width,
        height,
        floorHeight,
        materials,
        seed
    );

    return building;
}

// ========================================
// BUILDING FACADE
// ========================================

function createBuildingFacade(
    building,
    side,
    width,
    height,
    floorHeight,
    materials,
    seed
) {
    const facadeX = side * 7.55;

    // Ground floor shop fronts
    for (let i = -1; i <= 1; i++) {
        const z = i * 6;

        addBox(
            building,
            facadeX + side * 0.035,
            1.45,
            z,
            0.08,
            2.55,
            4.5,
            materials.darkGlass
        );

        // Shop frame
        addBox(
            building,
            facadeX + side * 0.1,
            2.85,
            z,
            0.18,
            0.15,
            4.8,
            materials.metal
        );

        // Shop sign
        createShopSign(
            building,
            facadeX + side * 0.18,
            3.45,
            z,
            side,
            seed + i,
            materials
        );
    }

    // Upper floor windows and balconies
    for (let floor = 1; floor < Math.floor(height / floorHeight); floor++) {
        const y = floor * floorHeight + 1.8;

        for (let i = -1; i <= 1; i++) {
            const z = i * 6;

            addBox(
                building,
                facadeX + side * 0.04,
                y,
                z,
                0.09,
                1.55,
                2.3,
                materials.glass
            );

            // Window frame
            addBox(
                building,
                facadeX + side * 0.12,
                y,
                z,
                0.12,
                1.7,
                2.5,
                materials.white
            );

            // Glass inset
            addBox(
                building,
                facadeX + side * 0.2,
                y,
                z,
                0.08,
                1.45,
                2.2,
                materials.glass
            );

            // Balcony slab
            addBox(
                building,
                facadeX + side * 0.65,
                y - 1.05,
                z,
                1.25,
                0.16,
                3.2,
                materials.concrete
            );

            // Balcony rail
            addBox(
                building,
                facadeX + side * 1.25,
                y - 0.55,
                z,
                0.08,
                0.9,
                3.2,
                materials.metal
            );

            // Balcony vertical bars
            for (let bar = -1.4; bar <= 1.4; bar += 0.45) {
                addBox(
                    building,
                    facadeX + side * 1.25,
                    y - 0.55,
                    z + bar,
                    0.08,
                    0.9,
                    0.055,
                    materials.metal
                );
            }
        }
    }

    // External air conditioners
    for (let floor = 1; floor < Math.floor(height / floorHeight); floor++) {
        const y = floor * floorHeight + 0.8;

        addBox(
            building,
            facadeX + side * 0.55,
            y,
            -9,
            0.85,
            0.55,
            1.3,
            materials.white
        );
    }

    // Drain pipes
    addBox(
        building,
        facadeX + side * 0.3,
        height / 2,
        width / 2 - 0.5,
        0.12,
        height,
        0.12,
        materials.metal
    );
}

// ========================================
// SHOP SIGNS
// ========================================

function createShopSign(
    building,
    x,
    y,
    z,
    side,
    seed,
    materials
) {
    const signColors = [
        "#b52d24",
        "#126b8d",
        "#27743e",
        "#b77b18",
        "#493e73"
    ];

    const labels = [
        "بقالة",
        "ماركت",
        "مطعم",
        "كهرباء",
        "قطع غيار"
    ];

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = signColors[
        Math.abs(seed) % signColors.length
    ];

    ctx.fillRect(0, 0, 512, 128);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 58px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";

    ctx.fillText(
        labels[Math.abs(seed) % labels.length],
        256,
        64
    );

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const signMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        emissive: 0xffffff,
        emissiveMap: texture,
        emissiveIntensity: 0.35,
        roughness: 0.6
    });

    const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(4.8, 1.2),
        signMaterial
    );

    sign.position.set(x, y, z);
    sign.rotation.y = side * Math.PI / 2;

    building.add(sign);

    // Sign frame
    addBox(
        building,
        x + side * 0.03,
        y,
        z,
        0.12,
        1.35,
        5,
        materials.metal
    );

    return sign;
}

// ========================================
// STREET LIGHTS
// ========================================

function createStreetLights(city, materials) {
    for (const side of [-1, 1]) {
        for (let z = -115; z <= 115; z += 24) {
            const x = side * 11.8;

            // Pole
            addCylinder(
                city,
                x,
                3.2,
                z,
                0.09,
                0.14,
                6.4,
                materials.metal
            );

            // Curved-style arm
            addBox(
                city,
                x - side * 0.65,
                6.25,
                z,
                1.4,
                0.12,
                0.12,
                materials.metal
            );

            // Lamp head
            addBox(
                city,
                x - side * 1.25,
                6.05,
                z,
                0.65,
                0.18,
                0.42,
                materials.lamp
            );
        }
    }
}

// ========================================
// TRAFFIC SIGNS
// ========================================

function createTrafficSigns(city, materials) {
    const positions = [-90, -30, 30, 90];

    for (const z of positions) {
        for (const side of [-1, 1]) {
            const x = side * 11.7;

            addCylinder(
                city,
                x,
                1.5,
                z + 5,
                0.045,
                0.055,
                3,
                materials.metal
            );

            // Circular sign
            const sign = new THREE.Mesh(
                new THREE.CircleGeometry(0.48, 24),
                new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    side: THREE.DoubleSide
                })
            );

            sign.position.set(
                x,
                2.8,
                z + 5
            );

            city.add(sign);

            const border = new THREE.Mesh(
                new THREE.TorusGeometry(
                    0.48,
                    0.075,
                    8,
                    24
                ),
                materials.red
            );

            border.position.copy(sign.position);
            city.add(border);
        }
    }
}

// ========================================
// TRAFFIC LIGHTS
// ========================================

function createTrafficLights(city, materials) {
    const intersections = [-90, -30, 30, 90];

    for (const z of intersections) {
        for (const side of [-1, 1]) {
            const x = side * 9.2;

            addCylinder(
                city,
                x,
                3,
                z + 7,
                0.07,
                0.09,
                6,
                materials.metal
            );

            addBox(
                city,
                x,
                5.4,
                z + 7,
                0.48,
                1.45,
                0.45,
                materials.metal
            );

            // Traffic signal lights
            const signalColors = [
                materials.red,
                materials.orange,
                materials.green
            ];

            for (let i = 0; i < 3; i++) {
                const light = new THREE.Mesh(
                    new THREE.CircleGeometry(0.14, 16),
                    signalColors[i]
                );

                light.position.set(
                    x,
                    5.85 - i * 0.43,
                    z + 7.24
                );

                city.add(light);
            }
        }
    }
}

// ========================================
// STREET DETAILS
// ========================================

function createStreetDetails(city, materials) {
    // Roadside bollards
    for (const side of [-1, 1]) {
        for (let z = -120; z <= 120; z += 12) {
            addCylinder(
                city,
                side * 9.25,
                0.55,
                z,
                0.11,
                0.15,
                1.1,
                materials.yellow
            );
        }
    }

    // Roadside utility boxes
    for (const side of [-1, 1]) {
        for (let z = -105; z <= 105; z += 42) {
            addBox(
                city,
                side * 10.9,
                0.75,
                z,
                0.55,
                1.5,
                0.75,
                materials.metal
            );
        }
    }

    // Small roadside concrete planters
    for (const side of [-1, 1]) {
        for (let z = -100; z <= 100; z += 50) {
            addBox(
                city,
                side * 10.4,
                0.45,
                z + 8,
                1.1,
                0.9,
                1.2,
                materials.concrete
            );
        }
    }
}
