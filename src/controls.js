
export function createControls({
    onSteer,
    onThrottle,
    onBrake
}) {
    // حاوية أزرار التحكم
    const controls = document.createElement("div");

    Object.assign(controls.style, {
        position: "fixed",
        inset: "0",
        zIndex: "100",
        pointerEvents: "none",
        fontFamily: "Arial, sans-serif",
        userSelect: "none",
        WebkitUserSelect: "none"
    });

    document.body.appendChild(controls);

    // إنشاء زر
    function makeButton({
        label,
        icon,
        left,
        right,
        bottom,
        top,
        color,
        width = "66px",
        height = "66px"
    }) {
        const button = document.createElement("button");

        button.type = "button";
        button.innerHTML = `
            <span style="font-size:27px;line-height:1">${icon}</span>
            <span style="font-size:12px;font-weight:800">${label}</span>
        `;

        Object.assign(button.style, {
            position: "absolute",
            left: left || "auto",
            right: right || "auto",
            bottom: bottom || "auto",
            top: top || "auto",
            width,
            height,
            border: "1px solid rgba(255,255,255,.3)",
            borderRadius: "16px",
            background: color,
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "3px",
            boxShadow: "0 4px 12px rgba(0,0,0,.3)",
            touchAction: "none",
            pointerEvents: "auto",
            padding: "5px",
            outline: "none",
            WebkitTapHighlightColor: "transparent"
        });

        controls.appendChild(button);
        return button;
    }

    // أزرار التوجيه - ناحية الشمال
    const leftButton = makeButton({
        label: "شمال",
        icon: "◀",
        left: "18px",
        bottom: "25px",
        color: "rgba(35,65,82,.92)"
    });

    const rightButton = makeButton({
        label: "يمين",
        icon: "▶",
        left: "94px",
        bottom: "25px",
        color: "rgba(35,65,82,.92)"
    });

    // دواسات القيادة - ناحية اليمين
    const throttleButton = makeButton({
        label: "بنزين",
        icon: "▲",
        right: "94px",
        bottom: "25px",
        color: "rgba(25,135,91,.94)",
        width: "70px",
        height: "82px"
    });

    const brakeButton = makeButton({
        label: "فرامل",
        icon: "▼",
        right: "18px",
        bottom: "25px",
        color: "rgba(175,57,52,.94)",
        width: "70px",
        height: "82px"
    });

    // زر ملء الشاشة - أعلى الشمال
    const fullscreenButton = document.createElement("button");

    fullscreenButton.type = "button";
    fullscreenButton.textContent = "⛶";

    Object.assign(fullscreenButton.style, {
        position: "absolute",
        top: "14px",
        left: "14px",
        width: "46px",
        height: "46px",
        border: "1px solid rgba(255,255,255,.35)",
        borderRadius: "12px",
        background: "rgba(25,40,50,.85)",
        color: "#fff",
        fontSize: "29px",
        pointerEvents: "auto",
        touchAction: "manipulation"
    });

    controls.appendChild(fullscreenButton);

    // التحكم بالضغط المستمر
    function bindHold(button, callback, value) {
        let activePointer = null;

        function start(event) {
            event.preventDefault();

            if (activePointer !== null) return;

            activePointer = event.pointerId;
            button.style.filter = "brightness(1.35)";
            button.style.transform = "scale(.94)";

            try {
                button.setPointerCapture(event.pointerId);
            } catch (_) {}

            callback(value);
        }

        function stop(event) {
            if (activePointer === null) return;
            if (
                event &&
                event.pointerId !== undefined &&
                event.pointerId !== activePointer
            ) return;

            activePointer = null;
            button.style.filter = "none";
            button.style.transform = "scale(1)";

            callback(0);
        }

        button.addEventListener("pointerdown", start);
        button.addEventListener("pointerup", stop);
        button.addEventListener("pointercancel", stop);
        button.addEventListener("lostpointercapture", stop);
        button.addEventListener("contextmenu", event => {
            event.preventDefault();
        });

        return () => stop();
    }

    const stopSteeringLeft = bindHold(
        leftButton,
        onSteer,
        -1
    );

    const stopSteeringRight = bindHold(
        rightButton,
        onSteer,
        1
    );

    const stopThrottle = bindHold(
        throttleButton,
        onThrottle,
        true
    );

    const stopBrake = bindHold(
        brakeButton,
        onBrake,
        true
    );

    // ملء الشاشة والخروج منها
    fullscreenButton.addEventListener("click", async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.error("Fullscreen error:", error);
        }
    });

    document.addEventListener("fullscreenchange", () => {
        fullscreenButton.textContent =
            document.fullscreenElement ? "⛶" : "⛶";
    });

    // تنظيف أزرار التحكم عند الحاجة
    function destroy() {
        stopSteeringLeft();
        stopSteeringRight();
        stopThrottle();
        stopBrake();
        controls.remove();
    }

    return { destroy };
}
