
import * as THREE from "three";
import { createEgyptianCity } from "./world/egyptian-city.js";

// -----------------------------------------------------
// إعداد الصفحة
// -----------------------------------------------------

document.body.innerHTML = "";

Object.assign(document.body.style, {
    margin: "0",
    padding: "0",
    overflow: "hidden",
    background: "#9bb9c9",
    fontFamily: "Arial, sans-serif"
});

const container = document.createElement("div");

Object.assign(container.style, {
    position: "fixed",
    inset: "0",
    overflow: "hidden"
});

document.body.appendChild(container);

// -----------------------------------------------------
// المشهد
// -----------------------------------------------------

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x9bb9c9);

scene.fog = new THREE.Fog(
    0x9bb9c9,
    100,
    310
);

// -----------------------------------------------------
// الكاميرا
// -----------------------------------------------------

const camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    700
);

camera.position.set(0, 10, -18);

// -----------------------------------------------------
// محرك العرض
// -----------------------------------------------------

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 1.5)
);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

container.appendChild(renderer.domElement);

// -----------------------------------------------------
// الإضاءة
// -----------------------------------------------------

const skyLight = new THREE.HemisphereLight(
    0xe5f1ff,
    0x766047,
    1.8
);

scene.add(skyLight);

const sun = new THREE.DirectionalLight(
    0xffe3bd,
    2.1
);

sun.position.set(-70, 100, -40);
sun.castShadow = true;

sun.shadow.mapSize.set(1024, 1024);

sun.shadow.camera.left = -45;
sun.shadow.camera.right = 45;
sun.shadow.camera.top = 70;
sun.shadow.camera.bottom = -70;

scene.add(sun);

// -----------------------------------------------------
// إنشاء الطريق
// -----------------------------------------------------

const city = createEgyptianCity(scene);

// -----------------------------------------------------
// واجهة اختبار القيادة
// -----------------------------------------------------

const panel = document.createElement("div");

Object.assign(panel.style, {
    position: "fixed",
    top: "14px",
    left: "14px",
    zIndex: "10",
    padding: "12px 15px",
    borderRadius: "12px",
    color: "white",
    background: "rgba(20,30,35,0.82)",
    direction: "rtl",
    fontSize: "13px",
    minWidth: "145px"
});

panel.innerHTML = `
    <div style="font-size:17px;font-weight:bold">
        MASHWAR
    </div>
    <div id="road-zone" style="margin-top:5px">
        طريق القاهرة - أسيوط
    </div>
    <div id="road-speed" style="margin-top:5px">
        السرعة: 60 كم/س
    </div>
`;

document.body.appendChild(panel);

// -----------------------------------------------------
// أزرار التحكم
// -----------------------------------------------------

const controls = document.createElement("div");

Object.assign(controls.style, {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "10px",
    zIndex: "20"
});

function makeButton(label) {
    const button = document.createElement("button");

    button.textContent = label;

    Object.assign(button.style, {
        border: "1px solid rgba(255,255,255,0.35)",
        borderRadius: "12px",
        padding: "13px 20px",
        background: "rgba(24,40,48,0.9)",
        color: "white",
        fontSize: "15px",
        fontWeight: "bold",
        touchAction: "manipulation"
    });

    controls.appendChild(button);

    return button;
}

const pauseButton = makeButton("إيقاف");
const slowerButton = makeButton("−");
const fasterButton = makeButton("+");

document.body.appendChild(controls);

// -----------------------------------------------------
// حالة القيادة التجريبية
// -----------------------------------------------------

let playerZ = 0;
let speed = 16.7;
let paused = false;
let night = false;

const clock = new THREE.Clock();

pauseButton.addEventListener("click", () => {
    paused = !paused;

    pauseButton.textContent = paused
        ? "استمرار"
        : "إيقاف";
});

slowerButton.addEventListener("click", () => {
    speed = Math.max(0, speed - 5);
});

fasterButton.addEventListener("click", () => {
    speed = Math.min(45, speed + 5);
});

// -----------------------------------------------------
// وضع الليل والنهار
// -----------------------------------------------------

const nightButton = makeButton("ليل");

nightButton.addEventListener("click", () => {
    night = !night;

    if (night) {
        scene.background.set(0x101d35);
        scene.fog.color.set(0x101d35);
        sun.intensity = 0.25;
        skyLight.intensity = 0.45;
        nightButton.textContent = "نهار";
    } else {
        scene.background.set(0x9bb9c9);
        scene.fog.color.set(0x9bb9c9);
        sun.intensity = 2.1;
        skyLight.intensity = 1.8;
        nightButton.textContent = "ليل";
    }
});

// -----------------------------------------------------
// تحديث واجهة المعلومات
// -----------------------------------------------------

const zoneLabel = document.getElementById("road-zone");
const speedLabel = document.getElementById("road-speed");

function updateInformation() {
    const index = Math.floor(playerZ / 180);
    const phase = ((index % 16) + 16) % 16;

    let zone = "طريق الصعيد";

    if (phase < 4) {
        zone = "ضواحي القاهرة";
    } else if (phase < 8) {
        zone = "الأراضي الزراعية";
    } else if (phase < 12) {
        zone = "الطريق الصحراوي";
    } else {
        zone = "قرى الصعيد";
    }

    zoneLabel.textContent = zone;

    speedLabel.textContent =
        `السرعة: ${Math.round(speed * 3.6)} كم/س`;
}

// -----------------------------------------------------
// حلقة التشغيل
// -----------------------------------------------------

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    if (!paused) {
        playerZ += speed * delta;
    }

    // تجديد الطريق والبيئة
    city.userData.update(
        delta,
        playerZ,
        night
    );

    // كاميرا خلفية متحركة
    camera.position.set(
        0,
        10.5,
        playerZ - 18
    );

    camera.lookAt(
        0,
        3.5,
        playerZ + 24
    );

    updateInformation();

    renderer.render(scene, camera);
}

animate();

// -----------------------------------------------------
// تغيير حجم الشاشة
// -----------------------------------------------------

window.addEventListener("resize", () => {
    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 1.5)
    );
});

console.log("MASHWAR highway preview started");
