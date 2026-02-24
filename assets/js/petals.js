(function () {
    var canvas = document.createElement('canvas');
    canvas.id = 'petalsCanvas';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var petals = [];
    var W, H;

    // Fewer petals on mobile for performance
    var PETAL_COUNT = window.innerWidth < 768 ? 20 : 38;

    // Warm yellow palette matching the dandelion flowers in the background
    var colors = [
        '#FFD54F', // amber 300
        '#FFCA28', // amber 400
        '#FFC107', // amber 500
        '#FFB300', // amber 600
        '#FFF176', // yellow 300
        '#FDD835', // yellow 600
        '#FFE082', // amber 200
        '#FFECB3'  // amber 100 (very light)
    ];

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', function () {
        resize();
        PETAL_COUNT = window.innerWidth < 768 ? 20 : 38;
    });
    resize();

    /* -------------------------------------------------------
       Create a single petal with randomized properties.
       fromRight = true  → spawn just off the right edge
       fromRight = false → spawn anywhere (initial fill)
       ------------------------------------------------------- */
    function createPetal(fromRight) {
        var size = 7 + Math.random() * 11;            // 7 – 18 px width
        var baseWind = 0.3 + Math.random() * 2.7;    // 0.3 – 3.0

        return {
            x: fromRight
                ? W + 20 + Math.random() * 120
                : Math.random() * W,
            y: Math.random() * H * 0.7,               // top 70 %

            size: size,
            aspect: 0.2 + Math.random() * 0.15,       // height ratio (thin)

            /* ---------- Wind ---------- */
            baseWind: baseWind,
            gustPhase: Math.random() * Math.PI * 2,
            gustFreq: 0.004 + Math.random() * 0.008,
            gustAmp: 0.3 + Math.random() * 0.9,

            /* ---------- Velocities (smoothed each frame) ---------- */
            vx: fromRight ? -baseWind * 0.5 : -baseWind * Math.random(),
            vy: 0,

            /* ---------- Rotation ---------- */
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.06,

            /* ---------- Flutter / wobble ---------- */
            wobPhase: Math.random() * Math.PI * 2,
            wobFreq: 0.018 + Math.random() * 0.028,
            wobAmp: 0.4 + Math.random() * 1.4,

            /* ---------- Visual ---------- */
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 0.45 + Math.random() * 0.45,

            t: Math.random() * 1000    // time offset so they don't sync
        };
    }

    // Fill initial petals spread across the screen
    for (var i = 0; i < PETAL_COUNT; i++) {
        petals.push(createPetal(false));
    }

    /* -------------------------------------------------------
       Draw a single petal (thin leaf / teardrop shape)
       ------------------------------------------------------- */
    function drawPetal(p) {
        var hw = p.size / 2;            // half-width (along the long axis)
        var hh = hw * p.aspect;         // half-height (thin axis)

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        // Leaf shape: pointed ends, slight belly
        ctx.beginPath();
        ctx.moveTo(hw, 0);                                          // right tip
        ctx.bezierCurveTo(hw * 0.45, -hh * 1.3, -hw * 0.45, -hh, -hw, 0);  // top curve
        ctx.bezierCurveTo(-hw * 0.45, hh, hw * 0.45, hh * 1.3, hw, 0);      // bottom curve
        ctx.fill();

        ctx.restore();
    }

    /* -------------------------------------------------------
       Physics update for one petal
       ------------------------------------------------------- */
    function updatePetal(p) {
        p.t++;

        // Current wind = base ± gust oscillation
        var gust = Math.sin(p.t * p.gustFreq + p.gustPhase) * p.gustAmp;
        var wind = Math.max(0.15, p.baseWind + gust);

        // ---- Core relationship ----
        // Gravity inversely proportional to wind strength
        //   wind = 3.0 → gravity ≈ 0.07  (almost no fall, strong push)
        //   wind = 0.3 → gravity ≈ 0.70  (drifts down more)
        var gravity = 0.2 / wind;

        // Flutter: vertical oscillation
        var flutter = Math.sin(p.t * p.wobFreq + p.wobPhase) * p.wobAmp;

        // Buoyancy: gentle upward push that grows as petal nears the
        // lower third – prevents petals from ever reaching the ground.
        var threshold = H * 0.62;
        var buoyancy = 0;
        if (p.y > threshold) {
            buoyancy = -((p.y - threshold) / (H - threshold)) * 0.45;
        }

        // Target velocities
        var tvx = -wind;
        var tvy = gravity + flutter * 0.07 + buoyancy;

        // Smooth interpolation (lerp) for natural acceleration
        p.vx += (tvx - p.vx) * 0.025;
        p.vy += (tvy - p.vy) * 0.035;

        // Apply
        p.x += p.vx;
        p.y += p.vy;

        // Rotation follows wind with some flutter
        p.rot += p.rotSpeed + p.vx * 0.008;

        // ---- Recycle off-screen petals ----
        if (p.x < -60) {
            p.x = W + 20 + Math.random() * 80;
            p.y = Math.random() * H * 0.55;
            p.t = 0;
        }
        if (p.y > H + 40) {
            p.x = W + 20 + Math.random() * 80;
            p.y = Math.random() * H * 0.3;
            p.t = 0;
        }
        // If petal drifts too high (unlikely but safeguard)
        if (p.y < -60) {
            p.y = 0;
        }
    }

    /* -------------------------------------------------------
       Animation loop
       ------------------------------------------------------- */
    function frame() {
        ctx.clearRect(0, 0, W, H);

        // Keep pool at target count
        while (petals.length < PETAL_COUNT) {
            petals.push(createPetal(true));
        }
        while (petals.length > PETAL_COUNT) {
            petals.pop();
        }

        for (var i = 0; i < petals.length; i++) {
            updatePetal(petals[i]);
            drawPetal(petals[i]);
        }

        requestAnimationFrame(frame);
    }

    // Start after preloader is gone (or immediately if already loaded)
    if (document.readyState === 'complete') {
        frame();
    } else {
        window.addEventListener('load', frame);
    }
})();
