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
    
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    
    gl.uniform1f(u_texColorWeight, this.texColorWeight);
    
    gl.uniform1i(u_whichTexture, this.textureNum);
    
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    
    // Front face
    let frontVertices = [0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0];
    let frontUV = [0.0, 0.0, 1.0, 1.0, 1.0, 0.0];
    this.drawTriangle3DUV(frontVertices, frontUV);
    
    let frontVertices2 = [0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0];
    let frontUV2 = [0.0, 0.0, 0.0, 1.0, 1.0, 1.0];
    this.drawTriangle3DUV(frontVertices2, frontUV2);
    
    // Back face
    let backVertices = [0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0];
    let backUV = [1.0, 0.0, 0.0, 0.0, 0.0, 1.0];
    this.drawTriangle3DUV(backVertices, backUV);
    
    let backVertices2 = [0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0];
    let backUV2 = [1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
    this.drawTriangle3DUV(backVertices2, backUV2);
    
    // Top face
    let topVertices = [0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0];
    let topUV = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0];
    this.drawTriangle3DUV(topVertices, topUV);
    
    let topVertices2 = [0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0];
    let topUV2 = [0.0, 0.0, 1.0, 1.0, 0.0, 1.0];
    this.drawTriangle3DUV(topVertices2, topUV2);
    
    // Bottom face
    let bottomVertices = [0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0];
    let bottomUV = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0];
    this.drawTriangle3DUV(bottomVertices, bottomUV);
    
    let bottomVertices2 = [0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0];
    let bottomUV2 = [0.0, 0.0, 1.0, 1.0, 0.0, 1.0];
    this.drawTriangle3DUV(bottomVertices2, bottomUV2);
    
    // Right face
    let rightVertices = [1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0];
    let rightUV = [0.0, 0.0, 0.0, 1.0, 1.0, 1.0];
    this.drawTriangle3DUV(rightVertices, rightUV);
    
    let rightVertices2 = [1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0];
    let rightUV2 = [0.0, 0.0, 1.0, 1.0, 1.0, 0.0];
    this.drawTriangle3DUV(rightVertices2, rightUV2);
    
    // Left face
    let leftVertices = [0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0];
    let leftUV = [1.0, 0.0, 0.0, 0.0, 0.0, 1.0];
    this.drawTriangle3DUV(leftVertices, leftUV);
    
    let leftVertices2 = [0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0];
    let leftUV2 = [1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
    this.drawTriangle3DUV(leftVertices2, leftUV2);
  }
  
  drawTriangle3DUV(vertices, uv) {
    const n = 3
    
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
    

    var uvBuffer = gl.createBuffer()
    if (!uvBuffer) {
      console.log('Failed to create the UV buffer object');
      return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
    gl.drawArrays(gl.TRIANGLES, 0, n);
  }
}