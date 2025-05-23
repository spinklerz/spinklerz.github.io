class Cube {
  constructor() {
    this.type = "cube";
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.texColorWeight = 1.0; 
    this.size = 5.0;
    this.matrix = new Matrix4();
    this.textureNum = -2; 
    this.whichTexture = -2; 
  }

  setColor(r, g, b, a) {
    this.color = [r, g, b, a];
  }
  
  setTexColorWeight(weight) {
    this.texColorWeight = weight;
  }
  
  setTexture(texNum) {
    this.textureNum = texNum;
    this.whichTexture = texNum; // Both need to be in sync
  }
  
  render() {
    var rgba = this.color;
    
    // Set shader uniforms
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniform1f(u_texColorWeight, this.texColorWeight);
    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    
    // Calculate normal matrix (inverse transpose of model matrix)
    var normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(this.matrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    
    // === Front face (Z = 0) ===
    // Triangle 1
    this.drawTriangle3DUVNormal(
      [0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0],  // vertices
      [0.0, 0.0, 1.0, 1.0, 1.0, 0.0],                 // uv
      [0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0] // normals (pointing to -Z)
    );
    
    // Triangle 2
    this.drawTriangle3DUVNormal(
      [0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0],  // vertices
      [0.0, 0.0, 0.0, 1.0, 1.0, 1.0],                 // uv
      [0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0] // normals (pointing to -Z)
    );
    
    // === Back face (Z = 1) ===
    // Triangle 1
    this.drawTriangle3DUVNormal(
      [0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0],  // vertices
      [1.0, 0.0, 0.0, 0.0, 0.0, 1.0],                 // uv
      [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0]   // normals (pointing to +Z)
    );
    
    // Triangle 2
    this.drawTriangle3DUVNormal(
      [0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0],  // vertices
      [1.0, 0.0, 0.0, 1.0, 1.0, 1.0],                 // uv
      [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0]   // normals (pointing to +Z)
    );
    
    // === Top face (Y = 1) ===
    // Triangle 1
    this.drawTriangle3DUVNormal(
      [0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0],  // vertices
      [0.0, 0.0, 1.0, 0.0, 1.0, 1.0],                 // uv
      [0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0]   // normals (pointing to +Y)
    );
    
    // Triangle 2
    this.drawTriangle3DUVNormal(
      [0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0],  // vertices
      [0.0, 0.0, 1.0, 1.0, 0.0, 1.0],                 // uv
      [0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0]   // normals (pointing to +Y)
    );
    
    // === Bottom face (Y = 0) ===
    // Triangle 1
    this.drawTriangle3DUVNormal(
      [0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0],  // vertices
      [0.0, 0.0, 1.0, 0.0, 1.0, 1.0],                 // uv
      [0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0] // normals (pointing to -Y)
    );
    
    // Triangle 2
    this.drawTriangle3DUVNormal(
      [0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0],  // vertices
      [0.0, 0.0, 1.0, 1.0, 0.0, 1.0],                 // uv
      [0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0] // normals (pointing to -Y)
    );
    
    // === Right face (X = 1) ===
    // Triangle 1
    this.drawTriangle3DUVNormal(
      [1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0],  // vertices
      [0.0, 0.0, 0.0, 1.0, 1.0, 1.0],                 // uv
      [1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0]   // normals (pointing to +X)
    );
    
    // Triangle 2
    this.drawTriangle3DUVNormal(
      [1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0],  // vertices
      [0.0, 0.0, 1.0, 1.0, 1.0, 0.0],                 // uv
      [1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0]   // normals (pointing to +X)
    );
    
    // === Left face (X = 0) ===
    // Triangle 1
    this.drawTriangle3DUVNormal(
      [0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0],  // vertices
      [1.0, 0.0, 0.0, 0.0, 0.0, 1.0],                 // uv
      [-1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0] // normals (pointing to -X)
    );
    
    // Triangle 2
    this.drawTriangle3DUVNormal(
      [0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0],  // vertices
      [1.0, 0.0, 0.0, 1.0, 1.0, 1.0],                 // uv
      [-1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0] // normals (pointing to -X)
    );
  }
  
  // Draw a triangle with 3D coordinates, UV mapping, and normal vectors
  drawTriangle3DUVNormal(vertices, uv, normals) {
    const n = 3;
    
    // Create a buffer object for positions
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log('Failed to create the vertex buffer object');
      return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    // Create a buffer object for UVs
    var uvBuffer = gl.createBuffer();
    if (!uvBuffer) {
      console.log('Failed to create the UV buffer object');
      return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
    
    // Create a buffer object for normals
    var normalBuffer = gl.createBuffer();
    if (!normalBuffer) {
      console.log('Failed to create the normal buffer object');
      return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);
    
    // Draw the triangle
    gl.drawArrays(gl.TRIANGLES, 0, n);
  }
}