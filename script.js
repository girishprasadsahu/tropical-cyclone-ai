/* =========================================================
                    ELEMENTS
========================================================= */

const fileInput =
    document.getElementById("fileInput");

const uploadBox =
    document.getElementById("uploadBox");

const chooseBtn =
    document.getElementById("chooseBtn");

const preview =
    document.getElementById("preview");

const previewContainer =
    document.getElementById("previewContainer");

const analyzeBtn =
    document.getElementById("analyzeBtn");

const scan =
    document.getElementById("scan");

const canvas =
    document.createElement("canvas");

const ctx =
    canvas.getContext("2d", {
        willReadFrequently: true
    });


/* =========================================================
                    CLOCK
========================================================= */

function updateClock() {

    const now = new Date();

    document.getElementById("clock").textContent =
        now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
}

setInterval(updateClock, 1000);

updateClock();


/* =========================================================
                    FILE SELECTION
========================================================= */

chooseBtn.addEventListener("click", function(e) {

    e.stopPropagation();

    fileInput.click();

});


uploadBox.addEventListener("click", function() {

    fileInput.click();

});


fileInput.addEventListener("change", function() {

    if (this.files.length) {

        loadImage(this.files[0]);

    }

});


/* =========================================================
                    DRAG & DROP
========================================================= */

uploadBox.addEventListener("dragover", function(e) {

    e.preventDefault();

    uploadBox.classList.add("drag");

});


uploadBox.addEventListener("dragleave", function() {

    uploadBox.classList.remove("drag");

});


uploadBox.addEventListener("drop", function(e) {

    e.preventDefault();

    uploadBox.classList.remove("drag");

    const file =
        e.dataTransfer.files[0];

    if (
        file &&
        file.type.startsWith("image/")
    ) {

        loadImage(file);

    }

});


/* =========================================================
                    LOAD IMAGE
========================================================= */

function loadImage(file) {

    if (!file.type.startsWith("image/")) {

        alert("Please upload an image file.");

        return;
    }

    const reader =
        new FileReader();

    reader.onload = function(e) {

        preview.src =
            e.target.result;

        previewContainer.classList.add("show");

        resetDashboard();

    };

    reader.readAsDataURL(file);
}


/* =========================================================
                    RESET DASHBOARD
========================================================= */

function resetDashboard() {

    setText(
        "detected",
        "READY TO ANALYZE"
    );

    document.getElementById("detected").style.color =
        "#39d8ff";

    setText("confidence", "--");

    const ids = [
        "detection",
        "cycloneType",
        "pattern",
        "intensity",
        "risk",
        "cloudDensity",
        "eye",
        "center",
        "direction",
        "speed",
        "pathCenter"
    ];

    ids.forEach(function(id) {

        setText(id, "--");

    });


    setText(
        "riskBig",
        "WAIT"
    );

    const riskCircle =
        document.getElementById("riskCircle");

    riskCircle.style.borderColor =
        "#00e676";

    riskCircle.style.boxShadow =
        "0 0 25px rgba(0,230,118,.18)";

    document.getElementById("riskBig").style.color =
        "#00e676";


    setText(
        "pathStatus",
        "WAITING FOR ANALYSIS"
    );


    updateChart(0);

    resetPath();

}


/* =========================================================
                    ANALYZE BUTTON
========================================================= */

analyzeBtn.addEventListener("click", function() {

    if (!preview.src) {

        alert(
            "Please upload an image first."
        );

        return;
    }


    analyzeBtn.disabled = true;

    scan.style.display = "block";

    analyzeBtn.textContent =
        "ANALYZING IMAGE...";


    setTimeout(function() {

        analyzeBtn.textContent =
            "VERIFYING SATELLITE FEATURES...";

    }, 600);


    setTimeout(function() {

        analyzeBtn.textContent =
            "CHECKING CYCLONIC STRUCTURE...";

    }, 1300);


    setTimeout(function() {

        analyzeBtn.textContent =
            "ANALYZING CLOUD CIRCULATION...";

    }, 2000);


    setTimeout(function() {

        analyzeBtn.textContent =
            "ESTIMATING RISK & PATH...";

    }, 2500);


    setTimeout(function() {

        analyzeImage();

    }, 3000);

});


/* =========================================================
                    ANALYZE IMAGE
========================================================= */

function analyzeImage() {

    const img =
        new Image();

    img.onload = function() {

        const maxSize = 500;

        let width = img.width;
        let height = img.height;


        if (width > height) {

            height =
                height * maxSize / width;

            width =
                maxSize;

        } else {

            width =
                width * maxSize / height;

            height =
                maxSize;

        }


        canvas.width =
            Math.floor(width);

        canvas.height =
            Math.floor(height);


        ctx.drawImage(
            img,
            0,
            0,
            canvas.width,
            canvas.height
        );


        const imageData =
            ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );


        const features =
            extractFeatures(
                imageData.data,
                canvas.width,
                canvas.height
            );


        const result =
            calculateResult(features);


        displayResult(
            result,
            features
        );

    };


    img.src =
        preview.src;
}


/* =========================================================
                EXTRACT IMAGE FEATURES
========================================================= */

function extractFeatures(
    data,
    width,
    height
) {

    let brightnessTotal = 0;

    let saturationTotal = 0;

    let cloudPixels = 0;

    let edgePixels = 0;

    let blueWaterPixels = 0;

    let greenPixels = 0;

    let brownPixels = 0;

    let darkPixels = 0;

    let brightPixels = 0;

    let total = 0;


    const step =
        Math.max(
            1,
            Math.floor(
                Math.min(width, height) / 400
            )
        );


    for (
        let y = 1;
        y < height - 1;
        y += step
    ) {

        for (
            let x = 1;
            x < width - 1;
            x += step
        ) {

            const i =
                (y * width + x) * 4;


            const r =
                data[i];

            const g =
                data[i + 1];

            const b =
                data[i + 2];


            const brightness =
                0.299 * r +
                0.587 * g +
                0.114 * b;


            brightnessTotal +=
                brightness;


            const maxRGB =
                Math.max(r, g, b);

            const minRGB =
                Math.min(r, g, b);


            const saturation =
                maxRGB === 0
                    ? 0
                    : (maxRGB - minRGB) /
                      maxRGB;


            saturationTotal +=
                saturation;


            /*
                CLOUD DETECTION

                Bright + low saturation
                pixels are treated as
                possible cloud pixels.
            */

            if (
                brightness > 135 &&
                saturation < 0.38
            ) {

                cloudPixels++;

            }


            if (brightness < 55) {

                darkPixels++;

            }


            if (brightness > 205) {

                brightPixels++;

            }


            /*
                WATER DETECTION

                Helps reject normal
                beach/ocean photographs.
            */

            if (
                b > r * 1.08 &&
                b >= g * 0.90 &&
                b > 65
            ) {

                blueWaterPixels++;

            }


            /*
                VEGETATION
            */

            if (
                g > r * 1.08 &&
                g > b * 1.03
            ) {

                greenPixels++;

            }


            /*
                LAND / SAND DETECTION
            */

            if (
                r > b * 1.25 &&
                g > b * 1.08 &&
                r > 80
            ) {

                brownPixels++;

            }


            /*
                EDGE DETECTION
            */

            const ri =
                (y * width + x + 1) * 4;

            const di =
                ((y + 1) * width + x) * 4;


            const rb =
                0.299 * data[ri] +
                0.587 * data[ri + 1] +
                0.114 * data[ri + 2];


            const db =
                0.299 * data[di] +
                0.587 * data[di + 1] +
                0.114 * data[di + 2];


            const difference =
                Math.abs(
                    brightness - rb
                ) +
                Math.abs(
                    brightness - db
                );


            if (difference > 42) {

                edgePixels++;

            }


            total++;

        }

    }


    const avgBrightness =
        brightnessTotal / total;


    const avgSaturation =
        saturationTotal / total;


    const cloudRatio =
        cloudPixels / total;


    const edgeRatio =
        edgePixels / total;


    const waterRatio =
        blueWaterPixels / total;


    const greenRatio =
        greenPixels / total;


    const landRatio =
        brownPixels / total;


    const darkRatio =
        darkPixels / total;


    const brightRatio =
        brightPixels / total;


    const center =
        findCenter(
            data,
            width,
            height
        );


    const spiralScore =
        radialStructure(
            data,
            width,
            height,
            center.x,
            center.y
        );


    const circularScore =
        circularSymmetry(
            data,
            width,
            height,
            center.x,
            center.y
        );


    const quadrantScore =
        quadrantVariation(
            data,
            width,
            height
        );


    return {

        avgBrightness,

        avgSaturation,

        cloudRatio,

        edgeRatio,

        waterRatio,

        greenRatio,

        landRatio,

        darkRatio,

        brightRatio,

        center,

        spiralScore,

        circularScore,

        quadrantScore
    };

}


/* =========================================================
                    FIND CENTER
========================================================= */

function findCenter(
    data,
    width,
    height
) {

    let bestScore =
        -Infinity;

    let bestX =
        width / 2;

    let bestY =
        height / 2;


    const step =
        Math.max(
            8,
            Math.floor(
                Math.min(width, height) / 35
            )
        );


    for (
        let y = height * .20;
        y < height * .80;
        y += step
    ) {

        for (
            let x = width * .20;
            x < width * .80;
            x += step
        ) {

            const inner =
                sample(
                    data,
                    width,
                    height,
                    x,
                    y,
                    Math.max(5, width * .018)
                );


            const outer =
                sample(
                    data,
                    width,
                    height,
                    x,
                    y,
                    Math.max(20, width * .075)
                );


            const score =
                outer - inner;


            if (
                score > bestScore
            ) {

                bestScore =
                    score;

                bestX =
                    x;

                bestY =
                    y;

            }

        }

    }


    return {

        x: bestX,

        y: bestY,

        score:
            Math.max(
                0,
                Math.min(
                    100,
                    bestScore * 2.5
                )
            )

    };

}


/* =========================================================
                        SAMPLE
========================================================= */

function sample(
    data,
    width,
    height,
    cx,
    cy,
    radius
) {

    let total = 0;

    let count = 0;


    const startX =
        Math.floor(cx - radius);

    const endX =
        Math.floor(cx + radius);

    const startY =
        Math.floor(cy - radius);

    const endY =
        Math.floor(cy + radius);


    for (
        let y = startY;
        y <= endY;
        y++
    ) {

        for (
            let x = startX;
            x <= endX;
            x++
        ) {

            if (
                x < 0 ||
                y < 0 ||
                x >= width ||
                y >= height
            ) {

                continue;

            }


            const dx =
                x - cx;

            const dy =
                y - cy;


            if (
                dx * dx +
                dy * dy >
                radius * radius
            ) {

                continue;

            }


            const i =
                (
                    y * width +
                    x
                ) * 4;


            total +=
                0.299 * data[i] +
                0.587 * data[i + 1] +
                0.114 * data[i + 2];


            count++;

        }

    }


    return count
        ? total / count
        : 0;

}


/* =========================================================
                    RADIAL STRUCTURE
========================================================= */

function radialStructure(
    data,
    width,
    height,
    cx,
    cy
) {

    let totalVariation = 0;

    let rings = 0;


    const maxRadius =
        Math.min(width, height) / 2;


    for (
        let radius = 15;
        radius < maxRadius;
        radius += 10
    ) {

        const values = [];


        for (
            let angle = 0;
            angle < Math.PI * 2;
            angle += Math.PI / 24
        ) {

            const x =
                Math.round(
                    cx +
                    Math.cos(angle) *
                    radius
                );


            const y =
                Math.round(
                    cy +
                    Math.sin(angle) *
                    radius
                );


            if (
                x < 0 ||
                y < 0 ||
                x >= width ||
                y >= height
            ) {

                continue;

            }


            const i =
                (y * width + x) * 4;


            const brightness =
                0.299 * data[i] +
                0.587 * data[i + 1] +
                0.114 * data[i + 2];


            values.push(
                brightness
            );

        }


        if (values.length) {

            const mean =
                values.reduce(
                    (a, b) => a + b,
                    0
                ) / values.length;


            let variance = 0;


            values.forEach(function(v) {

                variance +=
                    Math.pow(
                        v - mean,
                        2
                    );

            });


            variance /=
                values.length;


            totalVariation +=
                Math.sqrt(variance);


            rings++;

        }

    }


    if (!rings) {

        return 0;

    }


    return Math.min(
        100,
        (
            totalVariation /
            rings
        ) * 2.0
    );

}


/* =========================================================
                CIRCULAR SYMMETRY
========================================================= */

function circularSymmetry(
    data,
    width,
    height,
    cx,
    cy
) {

    let total = 0;

    let good = 0;


    const maxRadius =
        Math.min(width, height) * .38;


    for (
        let radius = 15;
        radius < maxRadius;
        radius += 12
    ) {

        for (
            let angle = 0;
            angle < Math.PI;
            angle += Math.PI / 12
        ) {

            const x1 =
                Math.round(
                    cx +
                    Math.cos(angle) *
                    radius
                );

            const y1 =
                Math.round(
                    cy +
                    Math.sin(angle) *
                    radius
                );


            const x2 =
                Math.round(
                    cx -
                    Math.cos(angle) *
                    radius
                );

            const y2 =
                Math.round(
                    cy -
                    Math.sin(angle) *
                    radius
                );


            if (
                x1 < 0 ||
                y1 < 0 ||
                x2 < 0 ||
                y2 < 0 ||
                x1 >= width ||
                y1 >= height ||
                x2 >= width ||
                y2 >= height
            ) {

                continue;

            }


            const i1 =
                (y1 * width + x1) * 4;

            const i2 =
                (y2 * width + x2) * 4;


            const b1 =
                0.299 * data[i1] +
                0.587 * data[i1 + 1] +
                0.114 * data[i1 + 2];


            const b2 =
                0.299 * data[i2] +
                0.587 * data[i2 + 1] +
                0.114 * data[i2 + 2];


            const diff =
                Math.abs(b1 - b2);


            if (diff < 45) {

                good++;

            }


            total++;

        }

    }


    if (!total) {

        return 0;

    }


    return Math.min(
        100,
        (good / total) * 100
    );

}


/* =========================================================
                QUADRANT VARIATION
========================================================= */

function quadrantVariation(
    data,
    width,
    height
) {

    const quadrants = [
        [],
        [],
        [],
        []
    ];


    for (
        let y = 0;
        y < height;
        y += 8
    ) {

        for (
            let x = 0;
            x < width;
            x += 8
        ) {

            const i =
                (y * width + x) * 4;


            const brightness =
                0.299 * data[i] +
                0.587 * data[i + 1] +
                0.114 * data[i + 2];


            let q;


            if (
                x < width / 2 &&
                y < height / 2
            ) {

                q = 0;

            }

            else if (
                x >= width / 2 &&
                y < height / 2
            ) {

                q = 1;

            }

            else if (
                x < width / 2 &&
                y >= height / 2
            ) {

                q = 2;

            }

            else {

                q = 3;

            }


            quadrants[q].push(
                brightness
            );

        }

    }


    const means =
        quadrants.map(function(arr) {

            if (!arr.length) {
                return 0;
            }

            return arr.reduce(
                (a, b) => a + b,
                0
            ) / arr.length;

        });


    const average =
        means.reduce(
            (a, b) => a + b,
            0
        ) / 4;


    let variation = 0;


    means.forEach(function(m) {

        variation +=
            Math.abs(
                m - average
            );

    });


    return Math.min(
        100,
        variation * 1.4
    );

}


/* =========================================================
                    CALCULATE RESULT
========================================================= */

function calculateResult(f) {

    /*
        IMPORTANT:

        The following is a browser-based
        heuristic classifier.

        It is NOT a trained meteorological
        AI model.
    */


    const imageLooksNatural =
        f.avgSaturation > 0.42 ||
        f.landRatio > 0.28 ||
        f.greenRatio > 0.20;


    const beachLike =
        (
            f.landRatio > 0.18 &&
            f.waterRatio > 0.18
        );


    const excessiveWater =
        f.waterRatio > 0.72;


    const adequateClouds =
        f.cloudRatio >= 0.12 &&
        f.cloudRatio <= 0.88;


    const spiral =
        f.spiralScore >= 32;


    const symmetry =
        f.circularScore >= 43;


    const structured =
        f.quadrantScore >= 8;


    /*
        STRONG REJECTION

        This is specifically useful for
        normal beach / ocean photos.
    */

    let isCyclone = false;

    let rawScore = 0;

    let rejectionReason = "";


    if (beachLike) {

        rejectionReason =
            "Image contains strong land-water boundary characteristics. Not consistent with a satellite cyclone structure.";

    }

    else if (excessiveWater) {

        rejectionReason =
            "Image is dominated by open-water visual features without sufficient organized cloud structure.";

    }

    else if (imageLooksNatural) {

        rejectionReason =
            "Image contains strong natural-image color characteristics rather than an organized satellite cloud system.";

    }

    else if (!adequateClouds) {

        rejectionReason =
            "Cloud coverage is insufficient or excessively uniform for cyclone identification.";

    }

    else if (!spiral) {

        rejectionReason =
            "No sufficiently organized curved cloud-band structure detected.";

    }

    else {

        /*
            Weighted cyclone score
        */

        rawScore =
            (f.spiralScore * 0.42) +
            (f.center.score * 0.18) +
            (f.circularScore * 0.18) +
            (f.cloudRatio * 100 * 0.12) +
            (f.edgeRatio * 100 * 0.06) +
            (f.quadrantScore * 0.04);


        /*
            Require multiple independent
            structural signals.
        */

        if (
            rawScore >= 47 &&
            spiral &&
            symmetry &&
            structured
        ) {

            isCyclone = true;

        }

        else {

            rejectionReason =
                "Cloud features are not sufficiently coherent to confirm a cyclonic circulation.";

        }

    }


    let score;


    if (isCyclone) {

        score =
            Math.round(
                Math.max(
                    48,
                    Math.min(
                        99,
                        rawScore
                    )
                )
            );

    }

    else {

        score =
            Math.round(
                Math.min(
                    18,
                    Math.max(
                        2,
                        f.cloudRatio * 15
                    )
                )
            );

    }


    /* =====================================================
                    CYCLONE CATEGORY
    ===================================================== */

    let cycloneType =
        "Not Applicable";

    let pattern =
        "No Spiral Found";

    let intensity =
        "None";

    let risk =
        "SAFE";

    let eye =
        "N/A";


    if (isCyclone) {

        /*
            4 CATEGORY SYSTEM
        */

        if (score < 56) {

            cycloneType =
                "Tropical Depression";

            intensity =
                "Depression";

            risk =
                "LOW";

        }

        else if (score < 68) {

            cycloneType =
                "Tropical Storm";

            intensity =
                "Moderate";

            risk =
                "MODERATE";

        }

        else if (score < 82) {

            cycloneType =
                "Severe Cyclone";

            intensity =
                "Severe";

            risk =
                "HIGH";

        }

        else {

            cycloneType =
                "Very Severe Cyclone";

            intensity =
                "Extreme";

            risk =
                "CRITICAL";

        }


        if (
            f.spiralScore >= 68
        ) {

            pattern =
                "Strong Spiral";

        }

        else if (
            f.spiralScore >= 50
        ) {

            pattern =
                "Spiral Bands";

        }

        else {

            pattern =
                "Curved Bands";

        }


        if (
            f.center.score >= 58
        ) {

            eye =
                "Clear Eye";

        }

        else if (
            f.center.score >= 35
        ) {

            eye =
                "Developing Eye";

        }

        else {

            eye =
                "Obscured";

        }

    }


    /* =====================================================
                    CONFIDENCE
    ===================================================== */

    let confidence;


    if (isCyclone) {

        confidence =
            Math.min(
                97,
                Math.max(
                    65,
                    52 + score * .45
                )
            );

    }

    else {

        /*
            Do not show fake 99% confidence
            for a heuristic rejection.
        */

        confidence =
            Math.min(
                97,
                Math.max(
                    78,
                    88 +
                    (
                        1 -
                        f.cloudRatio
                    ) * 8
                )
            );

    }


    /* =====================================================
                    PATH ESTIMATION
    ===================================================== */

    let path =
        null;


    if (isCyclone) {

        path =
            generatePath(
                score,
                f.center,
                f.spiralScore
            );

    }


    return {

        score,

        confidence,

        detected: isCyclone,

        cycloneType,

        pattern,

        intensity,

        risk,

        eye,

        rejectionReason,

        centerX:
            isCyclone
                ? Math.round(f.center.x)
                : "--",

        centerY:
            isCyclone
                ? Math.round(f.center.y)
                : "--",

        path

    };

}


/* =========================================================
                    PATH GENERATOR
========================================================= */

function generatePath(
    score,
    center,
    spiralScore
) {

    /*
        Direction is estimated from
        cyclone intensity/structure.

        It is NOT real weather forecasting.
    */


    const directions = [
        "NORTH-EAST",
        "NORTH-WEST",
        "EAST",
        "WEST"
    ];


    /*
        Deterministic direction so
        same image gives same result.
    */

    const index =
        Math.floor(
            (
                center.x +
                center.y +
                spiralScore
            ) % directions.length
        );


    const direction =
        directions[index];


    let speed;


    if (score >= 82) {

        speed =
            18 + Math.round(
                spiralScore / 12
            );

    }

    else if (score >= 68) {

        speed =
            14 + Math.round(
                spiralScore / 15
            );

    }

    else if (score >= 56) {

        speed =
            10 + Math.round(
                spiralScore / 18
            );

    }

    else {

        speed =
            7 + Math.round(
                spiralScore / 20
            );

    }


    /*
        SVG coordinates

        Current cyclone:
        lower-left

        Future movement:
        toward upper-right

        Small direction variation is
        applied based on detected direction.
    */

    let dx = 1;
    let dy = -1;


    if (direction === "NORTH-WEST") {

        dx = -1;
        dy = -1;

    }

    else if (direction === "EAST") {

        dx = 1;
        dy = 0;

    }

    else if (direction === "WEST") {

        dx = -1;
        dy = 0;

    }


    const startX = 70;
    const startY = 225;


    const distance =
        110 +
        score * 1.15;


    const points = [];


    const hours = [
        0,
        12,
        24,
        48,
        72
    ];


    hours.forEach(function(hour, index) {

        const progress =
            index / 4;


        /*
            Slight curve
            to make trajectory look
            more realistic.
        */

        const curve =
            Math.sin(
                progress * Math.PI
            ) * 25;


        let x =
            startX +
            dx *
            distance *
            progress;


        let y =
            startY +
            dy *
            distance *
            progress;


        if (direction === "EAST") {

            y -= curve;

        }

        else if (direction === "WEST") {

            y += curve;

        }

        else {

            x +=
                dx === 1
                    ? curve
                    : -curve;

        }


        x =
            Math.max(
                35,
                Math.min(
                    665,
                    x
                )
            );


        y =
            Math.max(
                35,
                Math.min(
                    265,
                    y
                )
            );


        points.push({
            x,
            y,
            hour
        });

    });


    return {

        direction,

        speed,

        points

    };

}


/* =========================================================
                    DISPLAY RESULT
========================================================= */

function displayResult(
    r,
    f
) {

    scan.style.display =
        "none";


    analyzeBtn.disabled =
        false;


    analyzeBtn.textContent =
        "✓ ANALYSIS COMPLETE";


    const detectedEl =
        document.getElementById(
            "detected"
        );


    const riskBigEl =
        document.getElementById(
            "riskBig"
        );


    const riskCircleEl =
        document.getElementById(
            "riskCircle"
        );


    /*
        CYCLONE
    */

    if (r.detected) {

        detectedEl.textContent =
            "✓ CYCLONE DETECTED";


        detectedEl.style.color =
            "#00f084";


        riskBigEl.textContent =
            r.risk;


        applyRiskStyle(
            riskCircleEl,
            riskBigEl,
            r.risk
        );


        setText(
            "direction",
            r.path.direction
        );


        setText(
            "speed",
            r.path.speed +
            " km/h"
        );


        setText(
            "pathCenter",
            "X:" +
            r.centerX +
            " Y:" +
            r.centerY
        );


        setText(
            "pathStatus",
            "TRAJECTORY ESTIMATED"
        );


        drawPath(
            r.path.points
        );

    }

    /*
        NOT CYCLONE
    */

    else {

        detectedEl.textContent =
            "✖ NOT A CYCLONE";


        detectedEl.style.color =
            "#ff4d5f";


        riskBigEl.textContent =
            "SAFE";


        riskBigEl.style.color =
            "#00e676";


        riskCircleEl.style.borderColor =
            "#00e676";


        riskCircleEl.style.boxShadow =
            "0 0 25px rgba(0,230,118,.2)";


        setText(
            "direction",
            "NOT AVAILABLE"
        );


        setText(
            "speed",
            "NOT AVAILABLE"
        );


        setText(
            "pathCenter",
            "NOT AVAILABLE"
        );


        setText(
            "pathStatus",
            "NO CYCLONE PATH"
        );


        resetPath();

    }


    /*
        CONFIDENCE
    */

    animateConfidence(
        r.confidence
    );


    /*
        RESULT VALUES
    */

    setText(
        "detection",
        r.detected
            ? "YES"
            : "NO"
    );


    setText(
        "cycloneType",
        r.cycloneType
    );


    setText(
        "pattern",
        r.pattern
    );


    setText(
        "intensity",
        r.intensity
    );


    setText(
        "risk",
        r.risk
    );


    setText(
        "cloudDensity",
        getCloudDensity(
            f.cloudRatio
        )
    );


    setText(
        "eye",
        r.eye
    );


    setText(
        "center",
        r.detected
            ? `X:${r.centerX} Y:${r.centerY}`
            : "Not Applicable"
    );


    colorRisk(
        document.getElementById("risk"),
        r.risk
    );


    /*
        INTENSITY CHART
    */

    updateChart(
        r.detected
            ? r.score
            : 0
    );

}


/* =========================================================
                CLOUD DENSITY
========================================================= */

function getCloudDensity(
    ratio
) {

    if (ratio >= .60) {

        return "Very High";

    }

    if (ratio >= .40) {

        return "High";

    }

    if (ratio >= .22) {

        return "Moderate";

    }

    return "Low";

}


/* =========================================================
                    RISK STYLE
========================================================= */

function applyRiskStyle(
    circle,
    big,
    risk
) {

    if (risk === "CRITICAL") {

        big.style.color =
            "#ff4d5f";

        circle.style.borderColor =
            "#ff4d5f";

        circle.style.boxShadow =
            "0 0 30px rgba(255,77,95,.35)";

    }

    else if (risk === "HIGH") {

        big.style.color =
            "#ff9800";

        circle.style.borderColor =
            "#ff9800";

        circle.style.boxShadow =
            "0 0 30px rgba(255,152,0,.35)";

    }

    else if (risk === "MODERATE") {

        big.style.color =
            "#ffc857";

        circle.style.borderColor =
            "#ffc857";

        circle.style.boxShadow =
            "0 0 30px rgba(255,200,87,.30)";

    }

    else {

        big.style.color =
            "#00e676";

        circle.style.borderColor =
            "#00e676";

        circle.style.boxShadow =
            "0 0 25px rgba(0,230,118,.20)";

    }

}


/* =========================================================
                    SET TEXT
========================================================= */

function setText(
    id,
    value
) {

    const el =
        document.getElementById(id);

    if (el) {

        el.textContent =
            value;

    }

}


/* =========================================================
                    CONFIDENCE
========================================================= */

function animateConfidence(
    target
) {

    const el =
        document.getElementById(
            "confidence"
        );


    let current = 0;


    const step =
        target / 30;


    const timer =
        setInterval(function() {

            current += step;


            if (
                current >= target
            ) {

                current =
                    target;

                clearInterval(timer);

            }


            el.textContent =
                current.toFixed(1) +
                "%";


        }, 20);

}


/* =========================================================
                    COLOR RISK
========================================================= */

function colorRisk(
    el,
    risk
) {

    el.classList.remove(
        "green",
        "yellow",
        "orange",
        "red"
    );


    if (
        risk === "SAFE" ||
        risk === "LOW"
    ) {

        el.classList.add(
            "green"
        );

    }

    else if (
        risk === "MODERATE"
    ) {

        el.classList.add(
            "yellow"
        );

    }

    else if (
        risk === "HIGH"
    ) {

        el.classList.add(
            "orange"
        );

    }

    else {

        el.classList.add(
            "red"
        );

    }

}


/* =========================================================
                    INTENSITY CHART
========================================================= */

function updateChart(
    score
) {

    const points =
        document.querySelectorAll(
            "#chartPoints circle"
        );


    const line =
        document.getElementById(
            "forecastLine"
        );


    const values =
        score === 0

            ? [
                0,
                0,
                0,
                0,
                0,
                0
            ]

            : [
                score,
                score + 5,
                score + 8,
                score + 13,
                score + 17,
                score + 11
            ];


    const max = 110;


    const coords = [];


    values.forEach(
        function(value, index) {

            value =
                Math.min(
                    max,
                    value
                );


            const x =
                50 +
                index * 80;


            const y =
                170 -
                (
                    value /
                    max
                ) * 120;


            coords.push(
                `${x},${y}`
            );


            if (points[index]) {

                points[index]
                    .setAttribute(
                        "cx",
                        x
                    );

                points[index]
                    .setAttribute(
                        "cy",
                        y
                    );

            }

        }
    );


    line.setAttribute(
        "points",
        coords.join(" ")
    );

}


/* =========================================================
                    PATH DRAWING
========================================================= */

function drawPath(
    points
) {

    const pathLine =
        document.getElementById(
            "pathLine"
        );


    const pathDots =
        document.getElementById(
            "pathDots"
        );


    const marker =
        document.getElementById(
            "cycloneMarker"
        );


    const pointString =
        points.map(function(p) {

            return (
                p.x +
                "," +
                p.y
            );

        }).join(" ");


    pathLine.setAttribute(
        "points",
        pointString
    );


    pathDots.innerHTML =
        "";


    points.forEach(function(p, index) {

        const circle =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle"
            );


        circle.setAttribute(
            "cx",
            p.x
        );


        circle.setAttribute(
            "cy",
            p.y
        );


        circle.setAttribute(
            "r",
            index === 0
                ? "8"
                : "5"
        );


        circle.setAttribute(
            "fill",
            "#00d9ff"
        );


        circle.setAttribute(
            "stroke",
            "#ffffff"
        );


        circle.setAttribute(
            "stroke-width",
            "2"
        );


        pathDots.appendChild(
            circle
        );

    });


    /*
        Convert SVG coordinates
        to percentage positions.
    */

    const first =
        points[0];


    marker.style.left =
        (
            first.x / 700 * 100
        ) + "%";


    marker.style.top =
        (
            first.y / 300 * 100
        ) + "%";


    /*
        Animate future points
    */

    points.forEach(function(p, index) {

        setTimeout(function() {

            marker.style.left =
                (
                    p.x / 700 * 100
                ) + "%";


            marker.style.top =
                (
                    p.y / 300 * 100
                ) + "%";


        }, index * 350);

    });

}


/* =========================================================
                    RESET PATH
========================================================= */

function resetPath() {

    const pathLine =
        document.getElementById(
            "pathLine"
        );


    const pathDots =
        document.getElementById(
            "pathDots"
        );


    const marker =
        document.getElementById(
            "cycloneMarker"
        );


    pathLine.setAttribute(
        "points",
        ""
    );


    pathDots.innerHTML =
        "";


    marker.style.left =
        "10%";


    marker.style.top =
        "73%";

}


/* =========================================================
                    SIDEBAR
========================================================= */

document
    .querySelectorAll(".menu-item")
    .forEach(function(item) {

        item.addEventListener(
            "click",
            function() {

                document
                    .querySelectorAll(
                        ".menu-item"
                    )
                    .forEach(function(x) {

                        x.classList.remove(
                            "active"
                        );

                    });


                this.classList.add(
                    "active"
                );

            }
        );

    });