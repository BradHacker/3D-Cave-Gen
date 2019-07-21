class Player {
  constructor(size, speed) {
    this.playerSize = size;
    this.playerSpeed = speed;
    this.location = createVector(0, 0, -wallHeight / 2);
    this.velocity = createVector(0, 0, 0);
  }

  move(forceX, forceY) {
    this.velocity.add(createVector(forceX, forceY, 0));
    this.velocity.setMag(this.playerSpeed);
  }

  update() {
    this.location.add(this.velocity);
    this.velocity = createVector(0, 0, 0);
  }

  display() {
    push();
    stroke(255, 0, 0);
    translate(this.location.x, this.location.y, -wallHeight / 2);
    sphere(this.playerSize);
    pop();
  }
}
