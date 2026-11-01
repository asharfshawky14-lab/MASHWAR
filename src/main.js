
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createEgyptianCity } from "./world/egyptian-city.js";

// =====================================
// 1. تجهيز الصفحة
// =====================================

document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";
document.body.style.background = "#9bb9c9";

const container = document.createElement("div");

container.id = "game-container";

Object.assign(container.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    overflow: "hidden"
});

document.body.appendChild(container);

// =====================================
// 2. إنشاء المشهد
// =====================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x9bb9c9);

scene.fog = new THREE.Fog(
    0x9bb9c9,
    130,
    380
);

// =====================================
// 3. إعداد الكاميرا
// =====================================

const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    600
);

camera.position.set(
    115,
    100,
    180
);

camera.lookAt(0, 0, 0);

// =====================================
// 4. محرك العرض
// =====================================

let renderer;

try {
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
    });
} catch (error) {
    document.body.innerHTML = `
        <div style="
            color:white;
            background:#17232d;
            height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            text-align:center;
            padding:25px;
            font-family:Arial;
        ">
            <div>
                <h2>تعذر تشغيل العالم ثلاثي الأبعاد</h2>
                <p>تأكد من أن المتصفح يدعم WebGL.</p>
            </div>
        </div>
    `;

    throw error;
}

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 1.5)
);

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping = THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 1.15;

container.appendChild(renderer.domElement);

// =====================================
// 5. الإضاءة الطبيعية
// =====================================

const ambientLight = new THREE.HemisphereLight(
    0xddeeff,
    0x665544,
    2.0
);

scene.add(ambientLight);

const sunlight = new THREE.DirectionalLight(
    0xffe2b5,
    2.5
);

sunlight.position.set(
    -70,
    120,
    80
);

scene.add(sunlight);

// =====================================
// 6. التحكم بالكاميرا
// =====================================

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.target.set(0, 0, 0);

controls.enableDamping = true;
controls.dampingFactor = 0.06;

controls.enablePan = true;
controls.enableZoom = true;
controls.enableRotate = true;

controls.minDistance = 18;
controls.maxDistance = 320;

controls.maxPolarAngle = Math.PI / 2.02;

controls.screenSpacePanning = false;

renderer.domElement.style.touchAction = "none";

// =====================================
// 7. إنشاء المدينة المصرية
// =====================================

let city;

try {
    city = createEgyptianCity(scene);

    if (!city) {
        throw new Error(
            "لم يتم إنشاء مجموعة المدينة"
        );
    }

} catch (error) {
    console.error(
        "City creation error:",
        error
    );

    throw error;
}

// =====================================
// 8. تغيير حجم العرض
// =====================================

function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;

    camera.updateProjectionMatrix();

    renderer.setSize(width, height);

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 1.5)
    );
}

window.addEventListener(
    "resize",
    handleResize
);

// =====================================
// 9. حلقة تشغيل العالم
// =====================================

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(
        clock.getDelta(),
        0.05
    );

    controls.update(delta);

    renderer.render(
        scene,
        camera
    );
}

animate();

// =====================================
// 10. تأكيد تشغيل العالم
// =====================================

console.log("MASHWAR 3D WORLD STARTED");

console.log("Egyptian city:", city);

console.log("Three.js renderer ready");
