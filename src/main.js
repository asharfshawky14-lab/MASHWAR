
import * as THREE from "three";
import { createEgyptianCity } from "./world/egyptian-city.js";
import { loadMicrobus } from "./vehicles/microbus.js";
import { createControls } from "./controls.js";
import { createTraffic } from "./world/traffic.js";
// إعداد الصفحة
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

// المشهد
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bb9c9);
scene.fog = new THREE.Fog(0x9bb9c9, 115, 390);

// الكاميرا
const camera = new THREE.PerspectiveCamera(
    64,
    window.innerWidth / window.innerHeight,
    0.1,
    650
);
camera.position.set(6.85, 9.5, -18);

// محرك العرض
const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: false,
    powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
renderer.shadowMap.enabled = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
container.appendChild(renderer.domElement);

// الإضاءة
const skyLight = new THREE.HemisphereLight(0xe6f0fa, 0x79664d, 1.75);
scene.add(skyLight);

const sun = new THREE.DirectionalLight(0xffe5c5, 1.35);
sun.position.set(-60, 90, -35);
sun.castShadow = false;
scene.add(sun);

// العالم
const city = createEgyptianCity(scene);

// حركة المرور
const traffic = createTraffic(scene);

// حالة القيادة
let playerZ = 0;
let speed = 0;

const MAX_FORWARD_SPEED = 45;
const MAX_REVERSE_SPEED = 8;
const ACCELERATION = 9;
const BRAKING = 18;
const COAST_DECELERATION = 1.8;

let throttlePressed = false;
let brakePressed = false;

const laneCenters = [3.35, 6.85, 10.35, 13.85];
let currentLane = 1;
let targetX = laneCenters[currentLane];

let microbus = null;
let night = false;
let lastHudUpdate = 0;

// تحميل الميكروباص
loadMicrobus(scene)
    .then(vehicle => {
        microbus = vehicle;
        microbus.position.set(targetX, 0, playerZ);
        console.log("MASHWAR microbus loaded successfully");
    })
    .catch(error => {
        console.error("Failed to load MASHWAR microbus:", error);
    });

// لوحة المعلومات
const panel = document.createElement("div");

Object.assign(panel.style, {
    position: "fixed",
    top: "12px",
    right: "12px",
    zIndex: "10",
    padding: "11px 14px",
    border: "1px solid rgba(255,255,255,.18)",
    borderRadius: "12px",
    color: "#fff",
    background: "rgba(17,27,32,.82)",
    direction: "rtl",
    fontSize: "13px",
    minWidth: "150px",
    backdropFilter: "blur(5px)"
});

panel.innerHTML = `
    <div style="font-size:18px;font-weight:800;letter-spacing:.5px">MASHWAR</div>
    <div id="road-zone" style="margin-top:6px">ضواحي القاهرة</div>
    <div id="road-speed" style="margin-top:5px">السرعة: 0 كم/س</div>
`;

document.body.appendChild(panel);

// زر الليل للحفاظ على الميزة القديمة
const nightButton = document.createElement("button");
nightButton.textContent = "ليل";

Object.assign(nightButton.style, {
    position: "fixed",
    top: "105px",
    right: "12px",
    zIndex: "20",
    padding: "9px 15px",
    border: "1px solid rgba(255,255,255,.25)",
    borderRadius: "10px",
    background: "rgba(17,27,32,.85)",
    color: "#fff",
    fontWeight: "bold",
    touchAction: "manipulation"
});

document.body.appendChild(nightButton);

nightButton.addEventListener("click", () => {
    night = !night;

    if (night) {
        scene.background.set(0x182538);
        scene.fog.color.set(0x182538);
        skyLight.intensity = 0.72;
        sun.intensity = 0.42;
        nightButton.textContent = "نهار";
    } else {
        scene.background.set(0x9bb9c9);
        scene.fog.color.set(0x9bb9c9);
        skyLight.intensity = 1.75;
        sun.intensity = 1.35;
        nightButton.textContent = "ليل";
    }
});

// ربط أزرار التحكم
createControls({
    onSteer(direction) {
        if (direction === 0) return;

        currentLane = THREE.MathUtils.clamp(
            currentLane + direction,
            0,
            laneCenters.length - 1
        );

        targetX = laneCenters[currentLane];
    },

    onThrottle(pressed) {
        throttlePressed = pressed;
    },

    onBrake(pressed) {
        brakePressed = pressed;
    }
});

// تحديث معلومات الطريق والسرعة
const zoneLabel = document.getElementById("road-zone");
const speedLabel = document.getElementById("road-speed");

function updateInformation(force = false) {
    const now = performance.now();

    if (!force && now - lastHudUpdate < 250) return;

    lastHudUpdate = now;

    const index = Math.floor(Math.abs(playerZ) / 180);
    const phase = index % 16;

    let zone = "طريق الصعيد";

    if (phase < 4) zone = "ضواحي القاهرة";
    else if (phase < 8) zone = "الأراضي الزراعية";
    else if (phase < 12) zone = "الطريق الصحراوي";
    else zone = "قرى الصعيد";

    zoneLabel.textContent = zone;

    speedLabel.textContent =
        `السرعة: ${Math.round(Math.abs(speed) * 3.6)} كم/س` +
        (speed < 0 ? " - رجوع للخلف" : "");
}

// حلقة التشغيل
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    // دواسة البنزين
    if (throttlePressed) {
        speed = Math.min(
            MAX_FORWARD_SPEED,
            speed + ACCELERATION * delta
        );
    }

    // دواسة الفرامل والرجوع للخلف
    else if (brakePressed) {
        if (speed > 0) {
            speed = Math.max(0, speed - BRAKING * delta);
        } else {
            speed = Math.max(
                -MAX_REVERSE_SPEED,
                speed - ACCELERATION * delta
            );
        }
    }

    // التباطؤ التدريجي عند ترك الدواسات
    else {
        if (speed > 0) {
            speed = Math.max(
                0,
                speed - COAST_DECELERATION * delta
            );
        } else if (speed < 0) {
            speed = Math.min(
                0,
                speed + COAST_DECELERATION * delta
            );
        }
    }

    // حركة الميكروباص للأمام أو الخلف
    playerZ += speed * delta;

    if (microbus) {
        microbus.position.z = playerZ;

        // انتقال سلس بين الحارات
        microbus.position.x = THREE.MathUtils.damp(
            microbus.position.x,
            targetX,
            5,
            delta
        );
    }

    // تحديث العالم
city.userData.update(delta, playerZ, night);

// تحديث حركة المرور
traffic.update(delta, playerZ, speed);

    // الكاميرا تتبع الميكروباص
    camera.position.x = THREE.MathUtils.damp(
        camera.position.x,
        targetX,
        5,
        delta
    );

    camera.position.z = playerZ - 18;
    camera.lookAt(
        camera.position.x,
        3.1,
        playerZ + 25
    );

    updateInformation();

    renderer.render(scene, camera);
}

animate();

// تغيير حجم الشاشة
function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 1.25)
    );
}

window.addEventListener("resize", resize);

console.log("MASHWAR driving controls connected");
