class Sphere {
    constructor() {
      this.type = "sphere";
      this.position = [0.0, 0.0, 0.0];
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.texColorWeight = 1.0;
      this.radius = 1.0;
      this.segments = 24;
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
      this.whichTexture = texNum;
    }
    
    setRadius(radius) {
      this.radius = radius;
    }
    
    setSegments(segments) {
      this.segments = segments;
    }
    
    render() {
      var rgba = this.color;
      
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniform1f(u_texColorWeight, this.texColorWeight);
      gl.uniform1i(u_whichTexture, this.textureNum);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    
      var normalMatrix = new Matrix4();
      normalMatrix.setInverseOf(this.matrix);
      normalMatrix.transpose();
      gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
      
      var vertices = [];
      var normals = [];
      var uvs = [];
      var indices = [];
      
      for (let latNumber = 0; latNumber <= this.segments; latNumber++) {
        let theta = latNumber * Math.PI / this.segments;
        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);
        
        for (let longNumber = 0; longNumber <= this.segments; longNumber++) {
          let phi = longNumber * 2 * Math.PI / this.segments;
          let sinPhi = Math.sin(phi);
          let cosPhi = Math.cos(phi);

          let x = cosPhi * sinTheta;
          let y = cosTheta;
          let z = sinPhi * sinTheta;
          
          // Normal 
          normals.push(x);
          normals.push(y);
          normals.push(z);
          
          //Position scaled by radius
          vertices.push(this.radius * x);
          vertices.push(this.radius * y);
          vertices.push(this.radius * z);
          
          // UV coordinates
          let u = 1 - (longNumber / this.segments);
          let v = 1 - (latNumber / this.segments);
          uvs.push(u);
          uvs.push(v);
        }
      }
      
      // Generate indices for triangle strips
      for (let latNumber = 0; latNumber < this.segments; latNumber++) {
        for (let longNumber = 0; longNumber < this.segments; longNumber++) {
          let first = (latNumber * (this.segments + 1)) + longNumber;
          let second = first + this.segments + 1;
          
          indices.push(first);
          indices.push(second);
          indices.push(first + 1);
          indices.push(second);
          indices.push(second + 1);
          indices.push(first + 1);
        }
      }
      var vertexBuffer = gl.createBuffer();
      if (!vertexBuffer) {
        console.log('Failed to create the vertex buffer object');
        return -1;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);
      
      var normalBuffer = gl.createBuffer();
      if (!normalBuffer) {
        console.log('Failed to create normal buffer object');
        return -1;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
      gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Normal);
      
      // Create and bind UV buffer
      var uvBuffer = gl.createBuffer();
      if (!uvBuffer) {
        console.log('Failed to create the UV buffer object');
        return -1;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
      gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_UV);
      
      // Create and bind index buffer
      var indexBuffer = gl.createBuffer();
      if (!indexBuffer) {
        console.log('Failed to create the index buffer object');
        return -1;
      }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }
  }