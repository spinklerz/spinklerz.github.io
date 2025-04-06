function handleDrawOperationEvent() {
    let operation = document.getElementById("operation").value;
    let scalar = parseFloat(document.getElementById("inputNumber").value);
    let v1 = new Vector3([parseFloat(document.getElementById("x1").value), parseFloat(document.getElementById("y1").value), 0]);
    let v2 = new Vector3([parseFloat(document.getElementById("x2").value), parseFloat(document.getElementById("y2").value), 0]);

    let v3, v4;

    // Clear the canvas
    let canvas = document.getElementById("example");
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawVector(v1, "red");
    drawVector(v2, "blue");

    switch (operation) {
        case "add":
            v3 = v1.add(v2);
            drawVector(v3, "green");
            break;
        case "sub":
            v3 = v1.sub(v2);
            drawVector(v3, "green");
            break;
        case "mul":
            v3 = v1.mul(scalar);
            v4 = v2.mul(scalar);
            drawVector(v3, "green");
            drawVector(v4, "green");
            break;
        case "div":
            v3 = v1.div(scalar);
            v4 = v2.div(scalar);
            drawVector(v3, "green");
            drawVector(v4, "green");
            break;
        case "mag":
            console.log("Magnitude of v1:", v1.magnitude());
            console.log("Magnitude of v2:", v2.magnitude());
            break;
        case "norm":
            v3 = v1.normalize();
            v4 = v2.normalize();
            drawVector(v3, "green");
            drawVector(v4, "green");
            break;
        case "angle":
            let angle = angleBetween(v1, v2);
            if (angle === null) {
                console.log("Cannot compute angle between zero-length vectors.");
            } else {
                console.log("Angle between v1 and v2: " + angle.toFixed(2) + " degrees");
            }
            break;
        case "area":
            let area = areaTriangle(v1, v2);
            console.log("Area of triangle formed by v1 and v2: " + area.toFixed(2));
            break;
            
            
    }
    
}

function areaTriangle(v1, v2) {
    let cross = Vector3.cross(v1, v2);
    let crossMag = cross.magnitude();
    return crossMag / 2;
  }
  
function angleBetween(v1, v2) {
    let dot = Vector3.dot(v1, v2);
    let mag1 = v1.magnitude();
    let mag2 = v2.magnitude();
  
    if (mag1 === 0 || mag2 === 0) {
      return null;
    }
  
    let cosTheta = dot / (mag1 * mag2);
    cosTheta = Math.min(1, Math.max(-1, cosTheta));
    let angleRad = Math.acos(cosTheta);
    return angleRad * (180 / Math.PI);
  }
  

function drawVector(v, color) {
    let ctx = document.getElementById("example").getContext("2d");
    ctx.beginPath();
    ctx.moveTo(200, 200);
    ctx.lineTo(200 + v.elements[0] * 20, 200 - v.elements[1] * 20);
    ctx.strokeStyle = color;
    ctx.stroke();
}

function handleDrawEvent(vectorNumber) {
    let x, y, color;

    if (vectorNumber === 1) {
        x = parseFloat(document.getElementById("x1").value);
        y = parseFloat(document.getElementById("y1").value);
        color = "red";
    } else if (vectorNumber === 2) {
        x = parseFloat(document.getElementById("x2").value);
        y = parseFloat(document.getElementById("y2").value);
        color = "blue";
    }

    let v = new Vector3([x, y, 0]);

    let canvas = document.getElementById("example");
    let ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawVector(v, color);

    if (vectorNumber === 1 && document.getElementById("x2").value && document.getElementById("y2").value) {
        let x2 = parseFloat(document.getElementById("x2").value);
        let y2 = parseFloat(document.getElementById("y2").value);
        let v2 = new Vector3([x2, y2, 0]);
        drawVector(v2, "blue");
    }
    if (vectorNumber === 2 && document.getElementById("x1").value && document.getElementById("y1").value) {
        let x1 = parseFloat(document.getElementById("x1").value);
        let y1 = parseFloat(document.getElementById("y1").value);
        let v1 = new Vector3([x1, y1, 0]);
        drawVector(v1, "red");
    }
}

function main() {
    var canvas = document.getElementById("example");
    if (!canvas) {
        console.log("Failed to retrieve the <canvas> element");
        return;
    }
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    document.getElementById("drawButton1").addEventListener("click", function () {
        handleDrawEvent(1);
    });
    document.getElementById("drawButton2").addEventListener("click", function () {
        handleDrawOperationEvent();
    });
}