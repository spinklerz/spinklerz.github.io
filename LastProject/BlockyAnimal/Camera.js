class Vector {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  
  add(v) {
    return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
  }
  
  subtract(v) {
    return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
  }
  
  multiply(k) {
    return new Vector(this.x * k, this.y * k, this.z * k);
  }
  
  divide(k) {
    if (k === 0) return new Vector(0, 0, 0);
    return new Vector(this.x / k, this.y / k, this.z / k);
  }
  
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  
  cross(v) {
    return new Vector(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }
}

class Camera {
  constructor() {
    this.eye = new Vector(0, 1, 3);
    this.at = new Vector(0, 0, -100);
    this.up = new Vector(0, 1, 0);
    this.rotationAngle = 0;
  }
  
  forward(distance = 0.1) {
    var forward = this.at.subtract(this.eye);
    forward = forward.divide(forward.length());
    
    // Get potential new position
    const newEye = this.eye.add(forward.multiply(distance));
    const newAt = this.at.add(forward.multiply(distance));
    
    if (checkCollision(newEye.x, newEye.z)) {
      this.at = newAt;
      this.eye = newEye;
    }
  }
  
  backward(distance = 0.1) {
    var forward = this.at.subtract(this.eye);
    forward = forward.divide(forward.length());
    
    const newEye = this.eye.subtract(forward.multiply(distance));
    const newAt = this.at.subtract(forward.multiply(distance));
    
    // Check collision before moving
    if (checkCollision(newEye.x, newEye.z)) {
      this.at = newAt;
      this.eye = newEye;
    }
  }
  
  left(distance = 0.1) {
    var forward = this.at.subtract(this.eye);
    forward = forward.divide(forward.length());
    var left = forward.cross(this.up);
    left = left.divide(left.length());
    
    
    const newEye = this.eye.add(left.multiply(distance));
    const newAt = this.at.add(left.multiply(distance));
    

    if (checkCollision(newEye.x, newEye.z)) {
      this.at = newAt;
      this.eye = newEye;
    }
  }
  
  right(distance = 0.1) {
    var forward = this.at.subtract(this.eye);
    forward = forward.divide(forward.length());
    var left = forward.cross(this.up);
    left = left.divide(left.length());
    
    // Get potential new position
    const newEye = this.eye.subtract(left.multiply(distance));
    const newAt = this.at.subtract(left.multiply(distance));
    
    if (checkCollision(newEye.x, newEye.z)) {
      this.at = newAt;
      this.eye = newEye;
    }
  }
  
  rotate(angleDelta) {
    this.rotationAngle += angleDelta;
    
    // Calculate new at position based on eye and angle
    const angleRad = this.rotationAngle * Math.PI / 180;
    const distance = 1;
    
    this.at.x = this.eye.x + Math.sin(angleRad) * distance;
    this.at.z = this.eye.z + Math.cos(angleRad) * distance;
  }
  

  getViewMatrix() {
    var viewMatrix = new Matrix4();
    viewMatrix.setLookAt(
      this.eye.x, this.eye.y, this.eye.z,
      this.at.x, this.at.y, this.at.z,
      this.up.x, this.up.y, this.up.z
    );
    return viewMatrix;
  }
}