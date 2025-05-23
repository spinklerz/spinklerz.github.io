// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec3 a_Normal;
  attribute vec2 a_UV;
  
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec3 v_Position;
  
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix; 
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    
    // Pass the normal and transformed position to fragment shader
    v_Position = vec3(u_ModelMatrix * a_Position);
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));
    v_UV = a_UV;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec3 v_Position;
  
  uniform vec4 u_FragColor;
  uniform vec3 u_LightPosition;
  uniform vec3 u_LightColor;
  uniform vec3 u_AmbientColor;
  uniform vec3 u_SpotlightPosition;
  uniform vec3 u_SpotlightDirection;
  uniform float u_SpotlightCutoff;
  uniform float u_SpecularAmount;
  uniform bool u_LightingEnabled;
  uniform vec3 u_CameraPosition;
  
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform float u_texColorWeight;
  uniform int u_whichTexture;
  
  void main() {
    vec4 baseColor;
    
    if (u_whichTexture == -3) {
      baseColor = vec4((v_Normal+1.0)/2.0, 1.0);
    }
    else if (u_whichTexture == -2) {
      baseColor = u_FragColor;
    } else if (u_whichTexture == -1) {
      baseColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0) {
      vec4 texColor = texture2D(u_Sampler0, v_UV);
      baseColor = mix(u_FragColor, texColor, u_texColorWeight);
    } else if (u_whichTexture == 1) {
      vec4 texColor = texture2D(u_Sampler1, v_UV);
      baseColor = mix(u_FragColor, texColor, u_texColorWeight);
    } else {
      baseColor = vec4(1.0, 0.2, 0.2, 1.0);
    }
    
    if (!u_LightingEnabled) {
      gl_FragColor = baseColor;
      return;
    }
  
    vec3 normal = normalize(v_Normal);
    
    vec3 ambient = u_AmbientColor * vec3(baseColor);
    
    vec3 lightDirection = normalize(u_LightPosition - v_Position);
    float nDotL = max(dot(normal, lightDirection), 0.0);
    vec3 diffuse = u_LightColor * vec3(baseColor) * nDotL;
    
    vec3 viewDirection = normalize(u_CameraPosition - v_Position);
    vec3 reflectionVector = reflect(-lightDirection, normal);
    float specularFactor = pow(max(dot(viewDirection, reflectionVector), 0.0), 32.0);
    vec3 specular = u_LightColor * specularFactor * u_SpecularAmount;

    float distance = length(u_LightPosition - v_Position);
    float attenuation = 1.0 / (1.0 + 0.1 * distance + 0.01 * distance * distance);
    
    vec3 pointLightContribution = (diffuse + specular) * attenuation;
  
    vec3 spotLightDir = normalize(u_SpotlightPosition - v_Position);
    float spotFactor = dot(spotLightDir, normalize(-u_SpotlightDirection));
    
    vec3 spotContribution = vec3(0.0);
    if (spotFactor > u_SpotlightCutoff) {
      float spotAttenuation = (spotFactor - u_SpotlightCutoff) / (1.0 - u_SpotlightCutoff);
      spotAttenuation = spotAttenuation * spotAttenuation;
      
      float spotDistance = length(u_SpotlightPosition - v_Position);
      float spotDistAttenuation = 1.0 / (1.0 + 0.1 * spotDistance + 0.01 * spotDistance * spotDistance);
      
      float spotNDotL = max(dot(normal, spotLightDir), 0.0);
      vec3 spotDiffuse = u_LightColor * vec3(baseColor) * spotNDotL;
      
      vec3 spotReflectionVector = reflect(-spotLightDir, normal);
      float spotSpecularFactor = pow(max(dot(viewDirection, spotReflectionVector), 0.0), 32.0);
      vec3 spotSpecular = u_LightColor * spotSpecularFactor * u_SpecularAmount;
      
      spotContribution = (spotDiffuse + spotSpecular) * spotAttenuation * spotDistAttenuation;
    }
    
    vec3 finalColor = ambient + pointLightContribution + spotContribution;
    gl_FragColor = vec4(finalColor, baseColor.a);
  }`;



// Global Variables for lighting
let g_lightPosition = [5.0, 5.0, 5.0];
let g_lightColor = [1.0, 1.0, 1.0];
let g_ambientColor = [0.3, 0.3, 0.3];
let g_specularAmount = 1.0;
let g_lightingEnabled = true;
let g_spotlightPosition = [0.0, 5.0, 0.0];
let g_spotlightDirection = [0.0, -1.0, 0.0];
let g_spotlightCutoff = 0.9; 

// For light animation
let g_lightAnimation = true;
let g_lightAngle = 0;
let g_lightRadius = 5.0;
let g_lightSpeed = 0.02;

let g_camera = {
  eye: {x: 0, y: 3, z: 9},  
  at:  {x: 0, y: 0, z: 0},  
  up:  {x: 0, y: 1, z: 0}   
};

let g_globalAngle = 0;

let texture0Loaded = false;
let texture1Loaded = false;

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let a_Normal;
let u_FragColor;
let u_ModelMatrix;
let u_NormalMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_texColorWeight;
let u_whichTexture;
let u_LightPosition;
let u_LightColor;
let u_AmbientColor;
let u_SpotlightPosition;
let u_SpotlightDirection;
let u_SpotlightCutoff;
let u_SpecularAmount;
let u_LightingEnabled;
let u_CameraPosition;

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

  // Get the storage location of attributes
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  
  if (a_Position < 0 || a_UV < 0 || a_Normal < 0) {
    console.log('Failed to get the storage location of attributes');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  u_texColorWeight = gl.getUniformLocation(gl.program, 'u_texColorWeight');
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  
  u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  u_AmbientColor = gl.getUniformLocation(gl.program, 'u_AmbientColor');
  u_SpotlightPosition = gl.getUniformLocation(gl.program, 'u_SpotlightPosition');
  u_SpotlightDirection = gl.getUniformLocation(gl.program, 'u_SpotlightDirection');
  u_SpotlightCutoff = gl.getUniformLocation(gl.program, 'u_SpotlightCutoff');
  u_SpecularAmount = gl.getUniformLocation(gl.program, 'u_SpecularAmount');
  u_LightingEnabled = gl.getUniformLocation(gl.program, 'u_LightingEnabled');
  u_CameraPosition = gl.getUniformLocation(gl.program, 'u_CameraPosition');
  
  if (!u_FragColor || !u_ModelMatrix || !u_NormalMatrix || !u_GlobalRotateMatrix || 
      !u_ViewMatrix || !u_ProjectionMatrix || !u_Sampler0 || !u_Sampler1 || 
      !u_texColorWeight || !u_whichTexture || !u_LightPosition || !u_LightColor || 
      !u_AmbientColor || !u_SpotlightPosition || !u_SpotlightDirection || 
      !u_SpotlightCutoff || !u_SpecularAmount || !u_LightingEnabled || !u_CameraPosition) {
    console.log('Failed to get the storage location of uniforms');
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


function keydown(ev) {
  switch(ev.keyCode) {
    case 37: 
      g_globalAngle -= 5;
      break;
    case 39: 
      g_globalAngle += 5;
      break;
    case 76: 
      g_lightingEnabled = !g_lightingEnabled;
      break;
    case 65:
      g_lightAnimation = !g_lightAnimation;
      break;
  }
  renderAllShapes();
}

// Function to update light position for animation
function updateLightPosition() {
  if (g_lightAnimation) {
    g_lightAngle += g_lightSpeed;
    g_lightPosition[0] = g_lightRadius * Math.cos(g_lightAngle);
    g_lightPosition[2] = g_lightRadius * Math.sin(g_lightAngle);
    renderAllShapes();
  }
  requestAnimationFrame(updateLightPosition);
}

function setupUI() {
  document.getElementById('redSlider').addEventListener('input', function(ev) {
    g_lightColor[0] = this.value / 100;
    renderAllShapes();
  });
  
  document.getElementById('normalToggle').addEventListener('click', function() {
    gl.uniform1i(u_whichTexture, -3);
    renderAllShapes();
});

  document.getElementById('greenSlider').addEventListener('input', function(ev) {
    g_lightColor[1] = this.value / 100;
    renderAllShapes();
  });
  
  document.getElementById('blueSlider').addEventListener('input', function(ev) {
    g_lightColor[2] = this.value / 100;
    renderAllShapes();
  });
  
  // Specular amount slider
  document.getElementById('specularSlider').addEventListener('input', function(ev) {
    g_specularAmount = this.value / 100;
    renderAllShapes();
  });
  
  // Light radius slider
  document.getElementById('lightRadiusSlider').addEventListener('input', function(ev) {
    g_lightRadius = this.value / 10;
    renderAllShapes();
  });
  

  document.getElementById('lightToggle').addEventListener('click', function(ev) {
    g_lightingEnabled = !g_lightingEnabled;
    renderAllShapes();
  });

  document.getElementById('animateLight').addEventListener('click', function(ev) {
    g_lightAnimation = !g_lightAnimation;
  });
}

function main() {
  // Set up WebGL
  setupWebGL();
  connectVariablesToGLSL();
  
  // Set up event handling
  document.onkeydown = keydown;
  
  // Set up UI
  setupUI();
  
  // Set up textures and render
  initTextures();
  
  // Start light animation
  updateLightPosition();
  
  // Initial render
  renderAllShapes();
}

function renderAllShapes(){
  // Set up matrices
  var projMat = new Matrix4();
  projMat.setPerspective(30, canvas.width/canvas.height, 0.1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  var viewMat = new Matrix4();
  viewMat.setLookAt(g_camera.eye.x, g_camera.eye.y, g_camera.eye.z,
                    g_camera.at.x, g_camera.at.y, g_camera.at.z,
                    g_camera.up.x, g_camera.up.y, g_camera.up.z);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  
  // Set lighting uniforms
  gl.uniform3fv(u_LightPosition, g_lightPosition);
  gl.uniform3fv(u_LightColor, g_lightColor);
  gl.uniform3fv(u_AmbientColor, g_ambientColor);
  gl.uniform3fv(u_SpotlightPosition, g_spotlightPosition);
  gl.uniform3fv(u_SpotlightDirection, g_spotlightDirection);
  gl.uniform1f(u_SpotlightCutoff, g_spotlightCutoff);
  gl.uniform1f(u_SpecularAmount, g_specularAmount);
  gl.uniform1i(u_LightingEnabled, g_lightingEnabled);
  gl.uniform3f(u_CameraPosition, g_camera.eye.x, g_camera.eye.y, g_camera.eye.z);
  
  // Clear the canvas
  gl.clearColor(0.1, 0.1, 0.15, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  renderScene();

  var lightMarker = new Sphere();
  lightMarker.setColor(1.0, 1.0, 0.0, 1.0);
  lightMarker.setRadius(0.2);
  lightMarker.matrix.translate(g_lightPosition[0], g_lightPosition[1], g_lightPosition[2]);
  lightMarker.render();
  
  var spotMarker = new Sphere();
  spotMarker.setColor(0.0, 0.5, 1.0, 1.0);
  spotMarker.setRadius(0.2);
  spotMarker.matrix.translate(g_spotlightPosition[0], g_spotlightPosition[1], g_spotlightPosition[2]);
  spotMarker.render();
}

function renderScene() {
  // Create floor
  var floor = new Cube();
  floor.setColor(0.5, 0.8, 0.5, 1.0); 
  floor.setTexture(1);
  floor.setTexColorWeight(1.0);
  floor.matrix.translate(0, -1.0, 0);
  floor.matrix.scale(10, 0.1, 10);
  floor.matrix.translate(-0.5, 0, -0.5);
  floor.render();
  
  // Create a sphere
  var sphere = new Sphere();
  sphere.setColor(0.9, 0.1, 0.1, 1.0);
  sphere.setRadius(1.0);
  sphere.matrix.translate(0.0, 1.0, 0.0);
  sphere.render();
  
  // Base of the house
  var base = new Cube();
  base.setColor(0.8, 0.8, 0.8, 1.0);
  base.setTexture(-2);
  base.setTexColorWeight(0.6);
  base.matrix.translate(-1.5, -0.5, -1.5);
  base.matrix.scale(3, 1.5, 3);
  base.render();
  
  // Roof of the house
  var roof = new Cube();
  roof.setColor(0.8, 0.3, 0.3, 1.0);
  roof.setTexture(-2);
  roof.matrix.translate(-1.7, 1.0, -1.7);
  roof.matrix.scale(3.4, 0.2, 3.4);
  roof.render();
  
  // Simple tower
  var tower = new Cube();
  tower.setColor(0.7, 0.7, 0.9, 1.0);
  tower.setTexture(-2);
  tower.setTexColorWeight(0.6);
  tower.matrix.translate(1.0, -0.5, 1.0);
  tower.matrix.scale(1, 2.5, 1);
  tower.render();
  
  // Tower top
  var towerTop = new Cube();
  towerTop.setColor(0.3, 0.3, 0.7, 1.0);
  towerTop.setTexture(-2);
  towerTop.matrix.translate(0.85, 2.0, 0.85);
  towerTop.matrix.scale(1.3, 0.2, 1.3);
  towerTop.render();
  
  // Animal
  // Body
  var catBody = new Cube();
  catBody.setColor(0.5, 0.5, 0.5, 1.0); 
  catBody.matrix.translate(-3.0, 0.0, 0.0);
  catBody.matrix.scale(1.5, 0.7, 0.8);
  catBody.render();
  
  // Head
  var catHead = new Cube();
  catHead.setColor(0.5, 0.5, 0.5, 1.0); 
  catHead.matrix.translate(-3.5, 0.7, 0.05);
  catHead.matrix.scale(0.7, 0.7, 0.7);
  catHead.render();
  
  // Ears
  var catEar1 = new Cube();
  catEar1.setColor(0.4, 0.4, 0.4, 1.0); 
  catEar1.matrix.translate(-3.5, 1.4, 0.5);
  catEar1.matrix.scale(0.2, 0.3, 0.2);
  catEar1.render();
  
  var catEar2 = new Cube();
  catEar2.setColor(0.4, 0.4, 0.4, 1.0); 
  catEar2.matrix.translate(-3.5, 1.4, 0.1);
  catEar2.matrix.scale(0.2, 0.3, 0.2);
  catEar2.render();
  
  // Tail
  var catTail = new Cube();
  catTail.setColor(0.45, 0.45, 0.45, 1.0); 
  catTail.matrix.translate(-1.5, 0.3, 0.0);
  catTail.matrix.rotate(20, 0, 0, 1);
  catTail.matrix.scale(1.0, 0.2, 0.2);
  catTail.render();
  
  // Legs
  var leg1 = new Cube();
  leg1.setColor(0.4, 0.4, 0.4, 1.0);
  leg1.matrix.translate(-3.0, -0.7, 0.5);
  leg1.matrix.scale(0.3, 0.7, 0.3);
  leg1.render();
  
  var leg2 = new Cube();
  leg2.setColor(0.4, 0.4, 0.4, 1.0);
  leg2.matrix.translate(-3.0, -0.7, 0);
  leg2.matrix.scale(0.3, 0.7, 0.3);
  leg2.render();
  
  var leg3 = new Cube();
  leg3.setColor(0.4, 0.4, 0.4, 1.0);
  leg3.matrix.translate(-1.8, -0.7, 0.5);
  leg3.matrix.scale(0.3, 0.7, 0.3);
  leg3.render();
  
  var leg4 = new Cube();
  leg4.setColor(0.4, 0.4, 0.4, 1.0);
  leg4.matrix.translate(-1.8, -0.7, 0.0);
  leg4.matrix.scale(0.3, 0.7, 0.3);
  leg4.render();
}

function sendTextureToGLSL(image, textureUnit, sampler) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log("Failed to create the texture object");
    return false;
  }
  
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(textureUnit);

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
    console.log("Wall texture loaded successfully");
  };
  
  image0.onerror = function() {
    console.log("Failed to load wall texture");
  };
  
  // Grass image (texture 1)
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
  // Set the source of the images
  image0.src = '3990038ed73ad3832195151af1c9438ca5ff765f_hq.jpg';
  image1.src = './37993.png';
  
  console.log("Started loading textures");
  return true;
}