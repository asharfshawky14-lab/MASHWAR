import * as THREE from "three";
import { createEgyptianCity } from "./world/egyptian-city.js";

// =====================================================
// MASHWAR - نسخة محسنة للموبايل
// واقعية مبسطة، بيئة قليلة الكثافة، بدون ظلال نهائيًا
// =====================================================

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
camera.position.set(0, 9.5, -18);

// محرك العرض: بدون Anti-aliasing لتخفيف الحمل على الهاتف
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

// إضاءة ثابتة ناعمة - لا توجد ظلال ولا مصادر ضوء نقطية
const skyLight = new THREE.HemisphereLight(0xe6f0fa, 0x79664d, 1.75);
scene.add(skyLight);

const sun = new THREE.DirectionalLight(0xffe5c5, 1.35);
sun.position.set(-60, 90, -35);
sun.castShadow = false;
scene.add(sun);

// العالم
const city = createEgyptianCity(scene);

// واجهة القيادة
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
    <div id="road-speed" style="margin-top:5px">السرعة: 60 كم/س</div>
`;
document.body.appendChild(panel);

// أزرار التحكم
const controls = document.createElement("div");
Object.assign(controls.style, {
    position: "fixed",
    bottom: "18px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "8px",
    zIndex: "20",
    direction: "ltr"
});

function makeButton(label) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    Object.assign(button.style, {
        minWidth: "52px",
        border: "1px solid rgba(255,255,255,.3)",
        borderRadius: "11px",
        padding: "12px 16px",
        background: "rgba(20,34,42,.92)",
        color: "#fff",
        fontSize: "15px",
        fontWeight: "700",
        touchAction: "manipulation"
    });
    controls.appendChild(button);
    return button;
}

const pauseButton = makeButton("إيقاف");
const slowerButton = makeButton("−");
const fasterButton = makeButton("+");
const nightButton = makeButton("ليل");
document.body.appendChild(controls);

// حالة القيادة
let playerZ = 0;
let speed = 16.7;
let paused = false;
let night = false;
let lastHudUpdate = 0;

const clock = new THREE.Clock();

pauseButton.addEventListener("click", () => {
    paused = !paused;
    pauseButton.textContent = paused ? "استمرار" : "إيقاف";
});

slowerButton.addEventListener("click", () => {
    speed = Math.max(0, speed - 5);
    updateInformation(true);
});

fasterButton.addEventListener("click", () => {
    speed = Math.min(45, speed + 5);
    updateInformation(true);
});

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

// تحديث النصوص عند الحاجة فقط، وليس في كل إطار
const zoneLabel = document.getElementById("road-zone");
const speedLabel = document.getElementById("road-speed");

function updateInformation(force = false) {
    const now = performance.now();
    if (!force && now - lastHudUpdate < 250) return;
    lastHudUpdate = now;

    const index = Math.floor(playerZ / 180);
    const phase = ((index % 16) + 16) % 16;

    let zone = "طريق الصعيد";
    if (phase < 4) zone = "ضواحي القاهرة";
    else if (phase < 8) zone = "الأراضي الزراعية";
    else if (phase < 12) zone = "الطريق الصحراوي";
    else zone = "قرى الصعيد";

    zoneLabel.textContent = zone;
    speedLabel.textContent = `السرعة: ${Math.round(speed * 3.6)} كم/س`;
}

// حلقة التشغيل
function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    if (!paused) playerZ += speed * delta;

    city.userData.update(delta, playerZ, night);

    camera.position.set(0, 9.5, playerZ - 18);
    camera.lookAt(0, 3.1, playerZ + 25);

    updateInformation();
    renderer.render(scene, camera);
}

animate();

// تغيير حجم الشاشة
function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
}
window.addEventListener("resize", resize);

console.log("MASHWAR optimized highway loaded - shadows disabled");
