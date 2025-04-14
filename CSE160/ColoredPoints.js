// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  `attribute vec4 a_Position;
   uniform float u_Size;
   void main() {
   gl_Position = a_Position;
   //gl_PointSize = 10.0;
   gl_PointSize = u_Size;
  }`;

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +  // uniform変数
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

// Global Variables
const POINT = 0
const TRIANGLE = 1
const CIRCLE = 2
let canvas;
let gl; 
let a_Position; 
let u_FragColor;
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let u_Size;
let g_selectedType = POINT
let g_circleSegments = 36; // Default value
let redoStack = [];

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  // gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserverDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL(){
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
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

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size){
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

function addActionsForHtmlUI(){
  document.getElementById("green").onclick = function() { g_selectedColor = [0.0, 1.0, 0.0, 1.0]} 
  document.getElementById("red").onclick = function() { g_selectedColor = [1.0, 0.0, 0.0, 1.0]} 
  document.getElementById("clear").onclick = function() { g_shapesList = []; renderAllShapes(); } 
  document.getElementById("pointButton").onclick = function() { g_selectedType=POINT } 
  document.getElementById("triButton").onclick = function() { g_selectedType=TRIANGLE } 
  document.getElementById("circleButton").onclick = function() { g_selectedType=CIRCLE } 
  document.getElementById('alphaSlide').addEventListener('input', function() {
    g_selectedColor[3] = this.value / 100;
  });

  document.getElementById("undo").onclick = function() {
    const shape = g_shapesList.pop();
    if (shape) redoStack.push(shape);
    renderAllShapes();
  };

  document.getElementById("redo").onclick = function() {
    const shape = redoStack.pop();
    if (shape) g_shapesList.push(shape);
    renderAllShapes();
  };
  document.getElementById('segmentSlider').addEventListener('input', function() {
    g_circleSegments = this.value;
  });
  document.getElementById('redSlide').addEventListener('mouseup', function() { g_selectedColor[0] = this.value/100; })
  document.getElementById('greenSlide').addEventListener('mouseup', function() { g_selectedColor[1] = this.value/100; })
  document.getElementById('blueSlide').addEventListener('mouseup', function() { g_selectedColor[2] = this.value/100; })
  document.getElementById('sizeSlide').addEventListener('mouseup', function() { g_selectedSize = this.value; })


}
function main(){
  setupWebGL()

  // Add Actions for html 
  addActionsForHtmlUI()
  // Initialize shaders
  connectVariablesToGLSL()

  // Register function (event handler) to be called on a mouse press
  // canvas.onmousedown = function(ev){ click(ev, gl, canvas, a_Position, u_FragColor) };
  canvas.onmousedown = click; 
  canvas.onmousemove = function(ev) { if(ev.buttons == 1) { click(ev) }};
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  const savedData = "[{\"type\":\"circle\",\"position\":[-0.325,0.26],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.345,0.26],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.61,-0.8],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.61,-0.8],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.61,-0.795],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.61,-0.775],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.61,-0.75],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.61,-0.72],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.61,-0.69],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.605,-0.66],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.595,-0.63],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.585,-0.605],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.57,-0.58],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.555,-0.56],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.54,-0.54],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.525,-0.52],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.51,-0.5],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.495,-0.485],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.48,-0.465],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.465,-0.45],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.45,-0.435],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.43,-0.42],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.415,-0.405],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.39,-0.39],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.365,-0.375],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.335,-0.36],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.3,-0.355],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.265,-0.35],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.23,-0.34],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.19,-0.34],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.155,-0.335],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.125,-0.335],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.1,-0.335],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.07,-0.335],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.045,-0.335],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[-0.02,-0.335],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.005,-0.34],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.03,-0.345],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.06,-0.35],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.085,-0.36],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.105,-0.37],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.13,-0.38],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.15,-0.39],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.165,-0.4],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.185,-0.415],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.2,-0.425],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.215,-0.44],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.235,-0.46],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.25,-0.48],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.265,-0.495],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.28,-0.515],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.295,-0.53],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.305,-0.545],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.315,-0.555],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.32,-0.565],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.33,-0.58],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.335,-0.595],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.345,-0.615],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.35,-0.63],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.36,-0.645],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.36,-0.655],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.365,-0.665],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.37,-0.675],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.375,-0.685],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.375,-0.7],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.38,-0.71],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.385,-0.72],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.385,-0.73],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.39,-0.735],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.39,-0.74],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.39,-0.75],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.395,-0.76],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.395,-0.765],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.395,-0.77],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.395,-0.775],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.395,-0.775],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.4,-0.78],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.4,-0.785],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.405,-0.79],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.41,-0.8],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36},{\"type\":\"circle\",\"position\":[0.41,-0.81],\"color\":[1,1,1,1],\"size\":\"40\",\"segments\":36}]"
  const parsedData = JSON.parse(savedData);
  console.log(parsedData)

  document.getElementById("draw").onclick = function() {
    drawFromData(parsedData);
  };
  
}

// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes = [];
var g_shapesList = [];
function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  return([x,y])
}

function renderAllShapes(){
  gl.clear(gl.COLOR_BUFFER_BIT);
  var startTime = performance.now()
  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot")
}
function click(ev) {
  let [x,y] = convertCoordinatesEventToGL(ev);
  let point;
  if( g_selectedType==POINT ){
    point = new Point()
  }
  else if ( g_selectedType==TRIANGLE){
    point = new Triangle()
  }
  else if (g_selectedType==CIRCLE){
    point = new Circle(g_circleSegments)
  }
  point.position=[x,y]
  point.color=g_selectedColor.slice()
  point.size=g_selectedSize;
  g_shapesList.push(point);
  // Store the coordinates to g_points array
  // g_points.push([x, y]);
  // g_colors.push([...g_selectedColor]);
  // g_sizes.push(g_selectedSize);

  renderAllShapes();
}

function sendTextToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm){
    console.log("Failed to get " + htmlID + " from HTML ");
    return
  }
  htmlElm.innerHTML = text;
}

function drawFromData(data) {
  for (let item of data) {
    let shape;

    if (item.type === "point") {
      shape = new Point();
    } else if (item.type === "triangle") {
      shape = new Triangle();
    } else if (item.type === "circle") {
      shape = new Circle(g_circleSegments);
    } else {
      continue; // Skip unknown types
    }

    shape.position = item.position;
    shape.color = item.color;
    shape.size = parseFloat(item.size);
    g_shapesList.push(shape);
  }

  renderAllShapes();
}
