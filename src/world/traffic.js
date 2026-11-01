
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// =====================================================
// MASHWAR - نظام حركة المرور
// سيارات واقعية على الاتجاهين
// =====================================================

const MODEL_PATHS = [
    "../../assets/models/traffic/1950s-roadster.glb",
    "../../assets/models/traffic/1960s-sports-car.glb",
    "../../assets/models/traffic/1980s-sedan.glb",
    "../../assets/models/traffic/1980s-sports-car.glb"
];

const LANES = {
    forward: [3.35, 6.85, 10.35, 13.85],
    opposite: [-3.35, -6.85, -10.35, -13.85]
};

const CONFIG = {
    carHeight: 1.5,
    sameDirectionCount: 8,
    oppositeDirectionCount: 8,
    recycleBehind: 90,
    spawnAhead: 230,
    minSameSpeed: 17,
    maxSameSpeed: 29,
    minOppositeSpeed: 19,
    maxOppositeSpeed: 27
};

const loader = new GLTFLoader();

function random(min, max) {
    return min + Math.random() * (max - min);
}

function randomInt(max) {
    return Math.floor(Math.random() * max);
}

// =====================================================
// تجهيز الموديل وضبط حجمه وارتفاعه
// =====================================================

function prepareModel(source) {
    const model = source.clone(true);

    model.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    bounds.getSize(size);
    bounds.getCenter(center);

    if (
        !Number.isFinite(size.x) ||
        !Number.isFinite(size.y) ||
        !Number.isFinite(size.z) ||
        size.y <= 0
    ) {
        throw new Error("Invalid traffic car model dimensions");
    }

    const scale = CONFIG.carHeight / size.y;
    model.scale.multiplyScalar(scale);

    model.updateMatrixWorld(true);

    bounds.setFromObject(model);
    bounds.getCenter(center);

    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= bounds.min.y;

    model.traverse(object => {
        if (!object.isMesh) return;

        object.castShadow = false;
        object.receiveShadow = false;
    });

    const vehicle = new THREE.Group();
    vehicle.add(model);

    return vehicle;
}

// =====================================================
// تحميل موديلات السيارات
// =====================================================

async function loadCarModels() {
    const models = await Promise.all(
        MODEL_PATHS.map(async path => {
            const url = new URL(path, import.meta.url).href;
            const gltf = await loader.loadAsync(url);
            return gltf.scene;
        })
    );

    return models;
}

// =====================================================
// إنشاء سيارة متحركة
// =====================================================

function createTrafficCar(models, options) {
    const source = models[options.modelIndex % models.length];
    const vehicle = prepareModel(source);

    vehicle.name = "MASHWAR_TRAFFIC_CAR";

    vehicle.position.set(
        options.x,
        0,
        options.z
    );

    // اتجاه حركة السيارة
    vehicle.rotation.y = options.direction === 1
        ? 0
        : Math.PI;

    vehicle.userData.direction = options.direction;
    vehicle.userData.speed = options.speed;
    vehicle.userData.laneX = options.x;
    vehicle.userData.modelIndex = options.modelIndex;

    return vehicle;
}

// =====================================================
// إنشاء نظام المرور
// =====================================================

export function createTraffic(scene) {
    const trafficGroup = new THREE.Group();
    trafficGroup.name = "MASHWAR_TRAFFIC";

    scene.add(trafficGroup);

    const cars = [];

    let modelsReady = false;
    let disposed = false;

    let lastPlayerZ = 0;

    // -------------------------------------------------
    // إنشاء السيارات بعد تحميل الموديلات
    // -------------------------------------------------

    const ready = loadCarModels()
        .then(models => {
            if (disposed) return;

            let modelIndex = 0;

            // سيارات اتجاه اللاعب
            for (let i = 0; i < CONFIG.sameDirectionCount; i++) {
                const lane = i % LANES.forward.length;
                const row = Math.floor(i / LANES.forward.length);

                const car = createTrafficCar(models, {
                    modelIndex: modelIndex++,
                    direction: 1,
                    x: LANES.forward[lane],
                    z: lastPlayerZ + 65 + row * 115 + random(0, 25),
                    speed: random(
                        CONFIG.minSameSpeed,
                        CONFIG.maxSameSpeed
                    )
                });

                trafficGroup.add(car);
                cars.push(car);
            }

            // سيارات الاتجاه المقابل
            for (let i = 0; i < CONFIG.oppositeDirectionCount; i++) {
                const lane = i % LANES.opposite.length;
                const row = Math.floor(i / LANES.opposite.length);

                const car = createTrafficCar(models, {
                    modelIndex: modelIndex++,
                    direction: -1,
                    x: LANES.opposite[lane],
                    z: lastPlayerZ + 80 + row * 115 + random(0, 25),
                    speed: random(
                        CONFIG.minOppositeSpeed,
                        CONFIG.maxOppositeSpeed
                    )
                });

                trafficGroup.add(car);
                cars.push(car);
            }

            modelsReady = true;

            console.log(
                `MASHWAR traffic loaded: ${cars.length} cars`
            );
        })
        .catch(error => {
            console.error(
                "MASHWAR traffic loading failed:",
                error
            );
        });

    // -------------------------------------------------
    // إعادة السيارة لمسافة آمنة أمام اللاعب
    // -------------------------------------------------

    function recycleCar(car, playerZ) {
        car.position.z = playerZ + random(
            CONFIG.spawnAhead * 0.55,
            CONFIG.spawnAhead
        );

        car.userData.speed = car.userData.direction === 1
            ? random(CONFIG.minSameSpeed, CONFIG.maxSameSpeed)
            : random(CONFIG.minOppositeSpeed, CONFIG.maxOppositeSpeed);
    }

    // -------------------------------------------------
    // تحديث حركة المرور
    // -------------------------------------------------

    function update(delta, playerZ, playerSpeed = 0) {
        if (!modelsReady || disposed) return;

        lastPlayerZ = playerZ;

        for (const car of cars) {
            const direction = car.userData.direction;
            const trafficSpeed = car.userData.speed;

            car.position.z += direction * trafficSpeed * delta;

            // السيارة أصبحت بعيدة خلف اللاعب
            if (car.position.z < playerZ - CONFIG.recycleBehind) {
                recycleCar(car, playerZ);
            }

            // السيارة بعيدة جدًا أمام اللاعب
            if (car.position.z > playerZ + CONFIG.spawnAhead + 120) {
                recycleCar(car, playerZ);
            }
        }
    }

    // -------------------------------------------------
    // حذف النظام عند الحاجة
    // -------------------------------------------------

    function dispose() {
        disposed = true;

        for (const car of cars) {
            trafficGroup.remove(car);
        }

        cars.length = 0;
        scene.remove(trafficGroup);
    }

    return {
        ready,
        update,
        dispose,
        group: trafficGroup
    };
}
