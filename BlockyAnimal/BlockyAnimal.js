var VSHADER_SOURCE =
  `attribute vec4 a_Position;
   uniform mat4 u_ModelMatrix;
   uniform mat4 u_GlobalRotateMatrix;
   void main() {
   gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`;

var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';


  function drawTriangle3D(vertices) {
    var n = 3

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer){
        console.log('Failed to create buffer object')
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0){
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }

    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0,0);
    gl.enableVertexAttribArray(a_Position);
    gl.drawArrays(gl.TRIANGLES, 0, n)
}

// Global Variables
let u_GlobalRotateMatrix;
let g_globalAngle = 0.0;
let g_headAngle = 0.0;
let g_midBodyAngle = 0.0;
let g_tailAngle = 0.0;
let g_tongueExtension = 0.0;
let u_ModelMatrix;
let canvas;
let gl;
let a_Position;
let u_FragColor;
let animationActive = false;
let g_startTime = 0;
let g_bodyWigglePhase = 0;


function setupWebGL() {
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function connectVariablesToGLSL(){
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }
}

function addActionsForHtmlUI(){
  document.getElementById("angleSlide").addEventListener('input', function() {
    g_globalAngle = this.value;
    renderAllShapes();
    document.getElementById('angleValue').innerText = this.value;
  });
  document.getElementById("headAngleSlide").addEventListener('input', function() {
    g_headAngle = this.value;
    renderAllShapes();
    document.getElementById('headAngleValue').innerText = this.value;
  });
  document.getElementById("midBodyAngleSlide").addEventListener('input', function() {
    g_midBodyAngle = this.value;
    renderAllShapes();
    document.getElementById('midBodyAngleValue').innerText = this.value;
  });
  document.getElementById("tailAngleSlide").addEventListener('input', function() {
    g_tailAngle = this.value;
    renderAllShapes();
    document.getElementById('tailAngleValue').innerText = this.value;
  });
  
  document.getElementById("animateOn").onclick = function() {
    animationActive = true;
    g_startTime = performance.now();
    tick();
  };
  
  document.getElementById("animateOff").onclick = function() {
    animationActive = false;
  };
}

function main(){
  setupWebGL();
  // Set the clear color and enable depth test
  addActionsForHtmlUI();
  
// Set the viewport and clear color
  connectVariablesToGLSL();


  // Render the scene
  renderAllShapes();
}

function tick() {
  if (!animationActive) return;
  
  var now = performance.now();
  var elapsed = now - g_startTime;
  g_startTime = now;
  updateAnimationAngles(elapsed);
  
  // Render the updated scene
  renderAllShapes();
  
  requestAnimationFrame(tick);
}

function updateAnimationAngles(elapsed) {
  var seconds = elapsed / 1000.0;
  
  g_bodyWigglePhase += seconds * 3.0;
  g_headAngle = 15 * Math.sin(g_bodyWigglePhase);
  document.getElementById("headAngleSlide").value = g_headAngle;
  document.getElementById('headAngleValue').innerText = g_headAngle.toFixed(1);
  // Mid body movement
  g_midBodyAngle = 20 * Math.sin(g_bodyWigglePhase - 0.5);
  document.getElementById("midBodyAngleSlide").value = g_midBodyAngle;
  document.getElementById('midBodyAngleValue').innerText = g_midBodyAngle.toFixed(1);
  
  // Tail movement
  g_tailAngle = 25 * Math.sin(g_bodyWigglePhase - 1.0);
  document.getElementById("tailAngleSlide").value = g_tailAngle;
  document.getElementById('tailAngleValue').innerText = g_tailAngle.toFixed(1);
  
}

function renderAllShapes(){
  var startTime = performance.now();
  
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // Render the scene
  renderScene();
  
  var duration = performance.now() - startTime;
  sendTextToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration), "performance");
}

function sendTextToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm){
    console.log("Failed to get " + htmlID + " from HTML ");
    return;
  }
  htmlElm.innerHTML = text;
}

function renderScene(){

  // HEAD SEGMENT
  var headMatrix = new Matrix4();
  headMatrix.translate(0, 0, 0);
  headMatrix.rotate(g_headAngle, 0, 1, 0); // Head turns left/right
  
  // Head base
  var headBase = new Cube();
  headBase.color = [0.2, 0.8, 0.2, 1.0]; // Green
  headBase.matrix = new Matrix4(headMatrix);
  headBase.matrix.scale(0.3, 0.2, 0.35);
  headBase.render();
  
  // Left eye
  var leftEye = new Cube();
  leftEye.color = [0.0, 0.0, 0.0, 1.0]; // Black
  leftEye.matrix = new Matrix4(headMatrix);
  leftEye.matrix.translate(0.2, 0.1, -0.02);
  leftEye.matrix.scale(0.06, 0.06, 0.06);
  leftEye.render();
  
  // Right eye
  var rightEye = new Cube();
  rightEye.color = [0.0, 0.0, 0.0, 1.0]; // Black
  rightEye.matrix = new Matrix4(headMatrix);
  rightEye.matrix.translate(0.18, 0.1, 0.3);
  rightEye.matrix.scale(0.06, 0.06, 0.06);
  rightEye.render();
  
  
  
  // BODY SEGMENT 1
  var bodyMatrix1 = new Matrix4();
  bodyMatrix1.translate(-0.3, 0, 0);
  bodyMatrix1.rotate(g_midBodyAngle, 0, 1, 0); // Body rotates left/right
  
  var body1 = new Cube();
  body1.color = [0.1, 0.7, 0.1, 1.0]; // Dark green
  body1.matrix = new Matrix4(bodyMatrix1);
  body1.matrix.scale(0.3, 0.25, 0.3);
  body1.render();
  
  // BODY SEGMENT 2
  var bodyMatrix2 = new Matrix4(bodyMatrix1);
  bodyMatrix2.translate(-0.3, 0, 0);
  bodyMatrix2.rotate(g_midBodyAngle/2, 0, 1, 0); // Additional rotation
  
  var body2 = new Cube();
  body2.color = [0.1, 0.6, 0.1, 1.0]; // Darker green
  body2.matrix = new Matrix4(bodyMatrix2);
  body2.matrix.scale(0.3, 0.25, 0.27);
  body2.render();
  
  // BODY SEGMENT 3
  var bodyMatrix3 = new Matrix4(bodyMatrix2);
  bodyMatrix3.translate(-0.3, 0, 0);
  bodyMatrix3.rotate(g_tailAngle/2, 0, 1, 0); // Partial tail rotation
  
  var body3 = new Cube();
  body3.color = [0.1, 0.5, 0.1, 1.0]; // Darker green
  body3.matrix = new Matrix4(bodyMatrix3);
  body3.matrix.scale(0.28, 0.22, 0.25);
  body3.render();
  
  // TAIL SEGMENT
  var tailMatrix = new Matrix4(bodyMatrix3);
  tailMatrix.translate(-0.28, 0, 0);
  tailMatrix.rotate(g_tailAngle, 0, 1, 0); // Tail rotates left/right
  
  var tail = new Cube();
  tail.color = [0.1, 0.4, 0.1, 1.0]; // Even darker green
  tail.matrix = new Matrix4(tailMatrix);
  tail.matrix.scale(0.25, 0.2, 0.2);
  tail.render();
  
  // TAIL TIP
  var tailTipMatrix = new Matrix4(tailMatrix);
  tailTipMatrix.translate(-0.25, 0, 0);
  tailTipMatrix.rotate(g_tailAngle*1.5, 0, 1, 0); // Exaggerated tail tip rotation
  
  var tailTip = new Cube();
  tailTip.color = [0.05, 0.3, 0.05, 1.0]; // Darkest green
  tailTip.matrix = new Matrix4(tailTipMatrix);
  tailTip.matrix.scale(0.15, 0.15, 0.15);
  tailTip.render();
  
}