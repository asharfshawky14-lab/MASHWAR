
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MODEL_URL =
    new URL("../../assets/vehicles/microbus/1990_toyota_hiace_h100.glb", import.meta.url).href;

export async function loadMicrobus(scene) {
    const loader = new GLTFLoader();

    const gltf = await loader.loadAsync(MODEL_URL);
    const model = gltf.scene;

    model.updateMatrixWorld(true);

    // قياس الموديل بعد تطبيق تحويلاته الأصلية
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
        throw new Error("Invalid microbus model dimensions");
    }

    // توحيد الارتفاع إلى 2.4 متر تقريبًا
    const targetHeight = 2.4;
    const scale = targetHeight / size.y;

    model.scale.multiplyScalar(scale);

    // إعادة حساب الحدود بعد ضبط الحجم
    model.updateMatrixWorld(true);

    bounds.setFromObject(model);
    bounds.getSize(size);
    bounds.getCenter(center);

    // توسيط الموديل أفقيًا ووضع عجلاته عند مستوى الأرض
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= bounds.min.y;

    model.traverse(object => {
        if (object.isMesh) {
            object.castShadow = false;
            object.receiveShadow = false;

            if (object.material) {
                object.material.side = THREE.FrontSide;
            }
        }
    });

    const vehicle = new THREE.Group();
    vehicle.name = "MASHWAR_MICROBUS";

    vehicle.add(model);

    // منتصف الحارة الثانية في اتجاه الذهاب
    vehicle.position.set(8.6, 0, 0);

    scene.add(vehicle);

    return vehicle;
}
