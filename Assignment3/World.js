// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform float u_texColorWeight;
  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;
    // Get texture color
    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0) {
      vec4 texColor = texture2D(u_Sampler0, v_UV);
      gl_FragColor = mix(u_FragColor, texColor, u_texColorWeight);
    } else if (u_whichTexture == 1) {
      vec4 texColor = texture2D(u_Sampler1, v_UV);
      gl_FragColor = mix(u_FragColor, texColor, u_texColorWeight);
    } else if (u_whichTexture == 2) {
      vec4 texColor = texture2D(u_Sampler2, v_UV);
      gl_FragColor = mix(u_FragColor, texColor, u_texColorWeight);
    } else {
      gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0);
    }
  }`;

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_ModelMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_texColorWeight;
let u_whichTexture;

let g_camera = {
  eye: {x: 0, y: 0, z: 0},  
  at:  {x: 0, y: 0, z: 0},  
  up:  {x: 0, y: 1.5, z: 0}   
};


let g_globalAngle = 0;

// Texture loading
let texture0Loaded = false;
let texture1Loaded = false;
let texture2Loaded = false;

let animationActive = false;
let lastTime = 0;

function moveCamera(strafe, forward) {
  const angle = g_rotationAngle * Math.PI / 180;
  
  // Calculate direction vector - FIXED sign for forward movement
  if (forward !== 0) {
    g_camera.eye.x -= Math.sin(angle) * forward;
    g_camera.eye.z -= Math.cos(angle) * forward; 
  }
  
  if (strafe !== 0) {
    g_camera.eye.x -= Math.cos(angle) * strafe;
    g_camera.eye.z += Math.sin(angle) * strafe;
  }
  
  // Update look-at point based on new position and angle
  g_camera.at.x = g_camera.eye.x + Math.sin(angle);
  g_camera.at.z = g_camera.eye.z + Math.cos(angle);
}
function rotateCamera(angle) {
  const radian = angle * Math.PI / 180;

  g_camera.at.x = g_camera.eye.x + Math.sin(radian);
  g_camera.at.z = g_camera.eye.z + Math.cos(radian);
}

function updateCameraDirection(yawAngle, pitchAngle) {
  // Convert angles from degrees to radians
  const yawRad = yawAngle * Math.PI / 180;
  const pitchRad = pitchAngle * Math.PI / 180;
  const lookX = Math.sin(yawRad) * Math.cos(pitchRad);
  const lookY = Math.sin(pitchRad);
  const lookZ = Math.cos(yawRad) * Math.cos(pitchRad);
  
  g_camera.at.x = g_camera.eye.x + lookX;
  g_camera.at.y = g_camera.eye.y + lookY;
  g_camera.at.z = g_camera.eye.z + lookZ;
}

function getRayFromCamera() {
  const angle = g_rotationAngle * Math.PI / 180;
  const pitchAngle = 0; // You can add pitch control if desired
  
  return {
    origin: {x: g_camera.eye.x, y: g_camera.eye.y, z: g_camera.eye.z},
    direction: {
      x: Math.sin(angle) * Math.cos(pitchAngle),
      y: Math.sin(pitchAngle),
      z: Math.cos(angle) * Math.cos(pitchAngle)
    }
  };
}


function rotateCamera(angle) {
  const radian = angle * Math.PI / 180;
  
  g_camera.at.x = g_camera.eye.x + Math.sin(radian);
  g_camera.at.z = g_camera.eye.z + Math.cos(radian);

  console.log("Camera rotated to angle:", angle, "Camera looking at:", g_camera.at);
}
function addOrDeleteBlock() {
  const ray = getRayFromCamera();
  const maxDistance = 5.0;
  
  // Simple ray-casting algorithm
  for (let dist = 0.1; dist <= maxDistance; dist += 0.1) {
    const x = Math.floor(ray.origin.x + ray.direction.x * dist + 16);
    const y = Math.floor(ray.origin.y + ray.direction.y * dist);
    const z = Math.floor(ray.origin.z + ray.direction.z * dist + 16);
    
    if (x >= 0 && x < 32 && z >= 0 && z < 32) {
      if (g_map[x][z] > 0) {
        g_map[x][z] = Math.max(0, g_map[x][z] - 1);
        console.log("Modified block at", x, z, "new height:", g_map[x][z]);
        return;
      }
    }
  }
  
  const placeDistance = 3.0;
  
  const x = Math.floor(ray.origin.x + ray.direction.x * placeDistance + 16);
  const z = Math.floor(ray.origin.z + ray.direction.z * placeDistance + 16);
  
  if (x >= 0 && x < 32 && z >= 0 && z < 32) {

    g_map[x][z] = Math.min(4, g_map[x][z] + 1);
    console.log("Added block at", x, z, "new height:", g_map[x][z]);
  }
}

function updateModeDisplay() {
  const modeElement = document.getElementById("currentMode");
  if (modeElement) {
    modeElement.innerText = "Mode: " + (g_mode === "navigate" ? "Navigate" : "Build");
  }
}
function updateBlockTypeDisplay() {
  const blockTypeElement = document.getElementById("blockType");
  if (blockTypeElement) {
    blockTypeElement.innerText = "Block Type: " + g_selectedBlockType;
  }
}

function advanceStory() {
  g_storyProgress++;
  
  const storyElement = document.getElementById("storyText");
  if (storyElement) {
    switch(g_storyProgress) {
      case 1:
        storyElement.innerText = "Welcome to Block World! Use WASD to move, Q/E to rotate.";
        break;
      case 2:
        storyElement.innerText = "Press B to enter build mode where you can create or destroy blocks.";
        break;
      default:
        storyElement.innerText = "Explore and build your own world!";
        break;
    }
  }
}

function drawMap() {
  // View distance optimization
  const viewDistance = 16;
  const centerX = Math.floor(g_camera.eye.x + 16);
  const centerZ = Math.floor(g_camera.eye.z + 16);
  
  const minX = Math.max(0, centerX - viewDistance);
  const maxX = Math.min(31, centerX + viewDistance);
  const minZ = Math.max(0, centerZ - viewDistance);
  const maxZ = Math.min(31, centerZ + viewDistance);
  
  // Object pooling for better performance
  let blockCounter = 0;
  let currentBlock = null;
  
  for(let x = minX; x <= maxX; x++) {
    for(let z = minZ; z <= maxZ; z++) {
      const blockType = g_map[x][z];
      if(blockType > 0) {
        const dx = x - 16 - g_camera.eye.x;
        const dz = z - 16 - g_camera.eye.z;
        const distSquared = dx*dx + dz*dz;
        
        if(distSquared > viewDistance*viewDistance) continue;
        
        const height = Math.min(blockType, 4);
        for(let y = 0; y < height; y++) {
          if (blockCounter < cubePool.length) {
            currentBlock = cubePool[blockCounter];
          } else {
            currentBlock = new Cube();
            cubePool.push(currentBlock);
          }
          blockCounter++;
          
          if (y === height - 1) {
            currentBlock.setColor(1.0, 1.0, 1.0, 1.0);
            currentBlock.setTexture(0); 
            currentBlock.setTexColorWeight(0.8);
          } else {
            currentBlock.setColor(0.8 - y*0.1, 0.8 - y*0.1, 0.8 - y*0.1, 1.0);
            currentBlock.setTexture(-2);
            currentBlock.setTexColorWeight(0.0);
          }
          
          currentBlock.matrix.setIdentity();
          currentBlock.matrix.translate(x-16, y-0.75, z-16);
          currentBlock.render();
        }
      }
    }
  }
}

function createUI() {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.top = "10px";
  container.style.left = "10px";
  container.style.color = "white";
  container.style.fontFamily = "Arial, sans-serif";
  container.style.padding = "10px";
  container.style.backgroundColor = "rgba(0,0,0,0.5)";
  
  const modeDisplay = document.createElement("div");
  modeDisplay.id = "currentMode";
  modeDisplay.innerText = "Mode: Navigate";
  
  const blockTypeDisplay = document.createElement("div");
  blockTypeDisplay.id = "blockType";
  blockTypeDisplay.innerText = "Block Type: 1";
  
  const controlsHelp = document.createElement("div");
  controlsHelp.innerText = "Controls: WASD=Move, Q/E=Rotate, B=Toggle Build, Space=Add/Delete Block, P=Story";
  
  const storyText = document.createElement("div");
  storyText.id = "storyText";
  storyText.innerText = "Press P to start your adventure! Note: If screen is blue press any k";
  storyText.style.marginTop = "10px";
  storyText.style.padding = "5px";
  storyText.style.border = "1px solid white";
  
  container.appendChild(modeDisplay);
  container.appendChild(blockTypeDisplay);
  container.appendChild(controlsHelp);
  container.appendChild(storyText);
  
  document.body.appendChild(container);
}

function initializeMap() {
  g_map = [];
  for (let x = 0; x < 32; x++) {
    g_map[x] = [];
    for (let z = 0; z < 32; z++) {
      g_map[x][z] = 0;
    }
  }

  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      if (x === 0 || x === 31 || z === 0 || z === 31) {
        g_map[x][z] = 1; 
      }
    }
  }
}

var g_eye = [0, 0, 3]; 
var g_at = [0, 0, -100];
var g_up = [0, 1, 0];

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }


  gl.enable(gl.DEPTH_TEST);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
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

  //Get the storage location of a_UV
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
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

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }
  
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }
  
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return;
  }
  
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return;
  }
  
  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if (!u_Sampler2) {
    console.log('Failed to get the storage location of u_Sampler2');
    return;
  }
  u_texColorWeight = gl.getUniformLocation(gl.program, 'u_texColorWeight');
  if (!u_texColorWeight) {
    console.log('Failed to get the storage location of u_texColorWeight');
    return;
  }
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return;
  }
  var viewMatrix = new Matrix4();
  viewMatrix.setLookAt(g_camera.eye.x, g_camera.eye.y, g_camera.eye.z, 
                      g_camera.at.x, g_camera.at.y, g_camera.at.z, 
                      g_camera.up.x, g_camera.up.y, g_camera.up.z);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  
  var projMatrix = new Matrix4();
  projMatrix.setPerspective(30, canvas.width/canvas.height, 0.1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMatrix.elements);
}

let g_rotationAngle = 0;
let g_lastMouseX = 0;
let g_lastMouseY = 0;
let g_mode = "navigate";
let g_selectedBlockType = 1;
let g_storyProgress = 0;

// Update the keydown function to handle Q and E for rotation
function keydown(ev) {
  switch(ev.keyCode) {
    case 37: 
    case 65: 
      moveCamera(-0.2, 0);
      break;
    case 39: 
    case 68: 
      moveCamera(0.2, 0);
      break;
    case 38: 
    case 87: 
      moveCamera(0, -0.2);
      break;
    case 40: 
    case 83: 
      moveCamera(0, 0.2);
      break;
    case 81: 
      g_rotationAngle -= 5;
      rotateCamera(g_rotationAngle);
      break;
    case 69: 
      g_rotationAngle += 5;
      rotateCamera(g_rotationAngle);
      break;
    case 66: 
      g_mode = g_mode === "navigate" ? "build" : "navigate";
      updateModeDisplay();
      break;
    case 49: 
      g_selectedBlockType = 1;
      updateBlockTypeDisplay();
      break;
    case 50: 
      g_selectedBlockType = 2;
      updateBlockTypeDisplay();
      break;
    case 32:
      if (g_mode === "build") {
        addOrDeleteBlock();
      }
      break;
    case 80:
      advanceStory();
      break;
  }
  renderAllShapes();
  console.log("Camera position:", g_camera.eye);
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  document.onkeydown = keydown;
  initTextures();
  initializeMap();
  renderAllShapes();
}



function renderAllShapes(){
  var startTime = performance.now();

  var projMat = new Matrix4();
  projMat.setPerspective(90, canvas.width/canvas.height, 0.1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  var viewMat = new Matrix4();
  viewMat.setLookAt(g_camera.eye.x, g_camera.eye.y, g_camera.eye.z,
                    g_camera.at.x, g_camera.at.y, g_camera.at.z,
                    g_camera.up.x, g_camera.up.y, g_camera.up.z);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
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

function renderScene() {
  var startTime = performance.now();
  
  // Clear with sky color
  gl.clearColor(0.4, 0.7, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // Floor - Using grass texture
  var floor = new Cube();
  floor.setColor(1.0, 1.0, 1.0, 1.0);
  floor.setTexture(1); 
  floor.setTexColorWeight(1.0); 
  floor.matrix.translate(0, -1.0, 0);
  floor.matrix.scale(50, 0.1, 50);
  floor.matrix.translate(-0.5, 0, -0.5);
  floor.render();
  

  drawMap();

  createBuildings();
  
  var duration = performance.now() - startTime;
  sendTextToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration), "performance");
}

const cubePool = [];

// Create more detailed buildings
function createBuildings() {
  // Building 1 - Simple house
  var house = new Cube();
  house.setColor(1.0, 1.0, 1.0, 1.0);
  house.setTexture(0); // Use Linux texture for walls
  house.setTexColorWeight(0.6);
  house.matrix.translate(-7, -0.5, -7);
  house.matrix.scale(2.0, 1.0, 2.0);
  house.render();
  
  // Roof for house 1
  var roof = new Cube();
  roof.setColor(0.7, 0.3, 0.3, 1.0);
  roof.setTexture(-2);
  roof.matrix.translate(-7, 0.5, -7);
  roof.matrix.scale(2.2, 0.3, 2.2);
  roof.render();
  
  // Building 2 - Tower
  var tower = new Cube();
  tower.setColor(1.0, 1.0, 1.0, 1.0);
  tower.setTexture(0); // Use Linux texture
  tower.setTexColorWeight(0.7);
  tower.matrix.translate(7, -0.5, -7);
  tower.matrix.scale(1.0, 2.5, 1.0);
  tower.render();
  
  // TCloud1
  var Cloud1 = new Cube();
  Cloud1.setColor(0.3, 0.3, 0.7, 1.0);
  Cloud1.setTexture(-2);
  Cloud1.matrix.translate(4, 3, -7);
  Cloud1.matrix.scale(1.3, 0.3, 1.3);
  Cloud1.render();

  var Cloud2 = new Cube();
  Cloud2.setColor(0.3, 0.3, 0.7, 1.0);
  Cloud2.setTexture(-2);
  Cloud2.matrix.translate(-4, 5, -7);
  Cloud2.matrix.scale(1.3, 0.3, 1.3);
  Cloud2.render();
  
  // Building 3 - Rectangular building
  var building = new Cube();
  building.setColor(1.0, 1.0, 1.0, 1.0);
  building.setTexture(0); // Use Linux texture
  building.setTexColorWeight(0.5);
  building.matrix.translate(-1.7, -0.5, 7);
  building.matrix.scale(5.0, 4.2, 1.5);
  building.render();
  
  // Windows for building 3
  var window1 = new Cube();
  window1.setColor(0.6, 0.8, 1.0, 1.0);
  window1.setTexture(-2);
  window1.matrix.translate(-0.3, -0.2, 6.95);
  window1.matrix.scale(2, 1, 0.1);
  window1.render();
  
  var window2 = new Cube();
  window2.setColor(0.6, 0.8, 1.0, 1.0);
  window2.setTexture(-2);
  window2.matrix.translate(-0.3, 1.9, 6.95);
  window2.matrix.scale(2, 1, 0.1);
  window2.render();
  
  // NEW BUILDINGS
  
  // Building 4 - Small shop
  var shop = new Cube();
  shop.setColor(1.0, 1.0, 1.0, 1.0);
  shop.setTexture(0); // Use Linux texture
  shop.setTexColorWeight(0.6);
  shop.matrix.translate(-7, -0.5, 5);
  shop.matrix.scale(1.5, 0.8, 1.5);
  shop.render();
  
  // Shop roof
  var shopRoof = new Cube();
  shopRoof.setColor(0.2, 0.5, 0.3, 1.0); // Green roof
  shopRoof.setTexture(-2);
  shopRoof.matrix.translate(-7, 0.05, 5);
  shopRoof.matrix.scale(1.7, 0.2, 1.7);
  shopRoof.render();
  
  // Building 5 - Tall skyscraper
  var skyscraper = new Cube();
  skyscraper.setColor(1.0, 1.0, 1.0, 1.0);
  skyscraper.setTexture(0); // Use Linux texture
  skyscraper.setTexColorWeight(0.8);
  skyscraper.matrix.translate(5, -0.5, 5);
  skyscraper.matrix.scale(1.0, 3.0, 1.0);
  skyscraper.render();
  
  // Skyscraper middle section
  var skyscraperMid = new Cube();
  skyscraperMid.setColor(0.8, 0.8, 0.9, 1.0);
  skyscraperMid.setTexture(-2);
  skyscraperMid.matrix.translate(5, 1.0, 5);
  skyscraperMid.matrix.scale(1.1, 0.2, 1.1);
  skyscraperMid.render();
  
  // Skyscraper top
  var skyscraperTop = new Cube();
  skyscraperTop.setColor(0.8, 0.8, 0.8, 1.0);
  skyscraperTop.setTexture(-2);
  skyscraperTop.matrix.translate(5, 2.25, 5);
  skyscraperTop.matrix.scale(0.2, 0.5, 0.2);
  skyscraperTop.render();
  
  // Building 6 - Wide flat building (mall)
  var mall = new Cube();
  mall.setColor(1.0, 1.0, 1.0, 1.0);
  mall.setTexture(0); // Use Linux texture
  mall.setTexColorWeight(0.6);
  mall.matrix.translate(-3, -0.5, -3);
  mall.matrix.scale(4.0, 0.7, 2.0);
  mall.render();
  
  // Mall entrance
  var mallEntrance = new Cube();
  mallEntrance.setColor(0.3, 0.3, 0.8, 1.0); // Blue entrance
  mallEntrance.setTexture(-2);
  mallEntrance.matrix.translate(-3, -0.3, -4.05);
  mallEntrance.matrix.scale(1.0, 0.5, 0.1);
  mallEntrance.render();
}


function sendTextureToGLSL(image, textureUnit, sampler) {
  var texture = gl.createTexture(); // Create a texture object
  if (!texture) {
    console.log("Failed to create the texture object");
    return false;
  }
  
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y-axis
  
  // Activate the texture unit
  gl.activeTexture(textureUnit);
  
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  
  gl.uniform1i(sampler, textureUnit - gl.TEXTURE0);
  
  console.log("Texture loaded successfully");
  
  renderAllShapes();
  
  return true;
}

function initTextures() {
  var image0 = new Image();
  if(!image0) {
    console.log("Failed to create the image object");
    return false;
  }
  image0.onload = function() {
    texture0Loaded = sendTextureToGLSL(image0, gl.TEXTURE0, u_Sampler0);
    console.log("Linux texture loaded successfully");
  };
  
  image0.onerror = function() {
    console.log("Failed to load Linux texture");
  };
  
  // Grass image (texture 1) - 37993.png
  var image1 = new Image();
  if(!image1) {
    console.log("Failed to create the second image object");
    return false;
  }
  
  image1.onload = function() {
    texture1Loaded = sendTextureToGLSL(image1, gl.TEXTURE1, u_Sampler1);
    console.log("Grass texture loaded successfully");
  };
  
  image1.onerror = function() {
    console.log("Failed to load grass texture");
  };
  
  // Set the image sources with the correct filenames
  image0.src = '3990038ed73ad3832195151af1c9438ca5ff765f_hq.jpg';  // Soil texture
  image1.src = './37993.png';  // Grass texture
  
  console.log("Started loading textures");
  return true;
}


// Function to create a simple maze

