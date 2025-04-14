class Circle {
    constructor(segments) {
      this.type = "circle";
      this.position = [0.0, 0.0];
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.size = 5.0;
      this.segments = segments || 36; // Default if not passed
    }
  
    render() {
      var xy = this.position;
      var rgba = this.color;
  
      // Pass the color of a point to u_FragColor variable
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
  
      // Pass the size to the shader
      gl.uniform1f(u_Size, this.size);
  
      // Draw the circle using triangle fan
      let d = this.size / 200.0;
      let angleStep = 360 / this.segments;
  
      let vertices = [xy[0], xy[1]];
      for (let angle = 0; angle <= 360; angle += angleStep) {
        let rad = angle * Math.PI / 180.0;
        let x = xy[0] + Math.cos(rad) * d;
        let y = xy[1] + Math.sin(rad) * d;
        vertices.push(x, y);
      }
  
      let n = vertices.length / 2;
      let vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);
  
      gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
    }
  }