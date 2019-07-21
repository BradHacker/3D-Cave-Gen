class Node {
  constructor(_pos) {
    this.position = _pos;
    this.vertexIndex = -1;
  }
}

class ControlNode extends Node {
  constructor(_pos, _active, squareSize) {
    super(_pos);
    this.active = _active;
    this.above = new Node(
      p5.Vector.add(_pos, createVector(0, squareSize / 2, 0))
    );
    this.right = new Node(
      p5.Vector.add(_pos, createVector(squareSize / 2, 0, 0))
    );
  }
}

class Square {
  constructor(_topLeft, _topRight, _bottomRight, _bottomLeft) {
    this.topLeft = _topLeft;
    this.topRight = _topRight;
    this.bottomRight = _bottomRight;
    this.bottomLeft = _bottomLeft;

    this.centerTop = this.topLeft.right;
    this.centerRight = this.bottomRight.above;
    this.centerBottom = this.bottomLeft.right;
    this.centerLeft = this.bottomLeft.above;

    this.configuration = 0;

    if (this.topLeft.active) this.configuration += 8;
    if (this.topRight.active) this.configuration += 4;
    if (this.bottomRight.active) this.configuration += 2;
    if (this.bottomLeft.active) this.configuration += 1;
  }
}

class SquareGrid {
  constructor(map, squareSize) {
    this.squares = [];
    const nodeCountX = map.length;
    const nodeCountY = map[0].length;
    const mapWidth = nodeCountX * squareSize;
    const mapHeight = nodeCountY * squareSize;

    this.controlNodes = [];

    for (let x = 0; x < nodeCountX; x++) {
      this.controlNodes[x] = [];
      for (let y = 0; y < nodeCountY; y++) {
        const pos = createVector(
          -width / 2 + x * squareSize + squareSize / 2,
          -height / 2 + y * squareSize + squareSize / 2,
          0
        );
        this.controlNodes[x][y] = new ControlNode(
          pos,
          map[x][y] === 1,
          squareSize
        );
      }
    }

    this.squares = [];

    for (let x = 0; x < nodeCountX - 1; x++) {
      this.squares[x] = [];
      for (let y = 0; y < nodeCountY - 1; y++) {
        this.squares[x][y] = new Square(
          this.controlNodes[x][y + 1],
          this.controlNodes[x + 1][y + 1],
          this.controlNodes[x + 1][y],
          this.controlNodes[x][y]
        );
      }
    }
  }
}

class Triangle {
  constructor(a, b, c) {
    // Integer
    this.vertexIndexA = a;
    // Integer
    this.vertexIndexB = b;
    // Integer
    this.vertexIndexC = c;

    this.verticies = [a, b, c];
  }

  /**
   * @param {integer} vertexIndex - A Vertex Index
   * @return {boolean} If the triangle contains the vertex index
   */
  contains(vertexIndex) {
    return (
      vertexIndex === this.vertexIndexA ||
      vertexIndex === this.vertexIndexB ||
      vertexIndex === this.vertexIndexC
    );
  }
}

class MeshGenerator {
  constructor(_wallHeight) {
    this.wallHeight = _wallHeight;

    // [PVector]
    this.verticies = [];
    // [Integer]
    this.triangles = [];
    // Key - Index, Value - [Triangle]
    this.triangleDictionary = {};
    // [[Integer]]
    this.outlines = [];
    // Key - Index, Value - Checked
    this.checkedVerticies = {};
  }

  generateMesh(map, squareSize) {
    this.triangleDictionary = {};
    this.outlines = [];
    this.checkedVerticies = {};

    // SquareGrid
    this.squareGrid = new SquareGrid(map, squareSize);
    // Integer
    this.squareSize = squareSize;

    for (let x = 0; x < this.squareGrid.squares.length; x++) {
      for (let y = 0; y < this.squareGrid.squares[0].length; y++) {
        this.triangulateSquare(this.squareGrid.squares[x][y]);
      }
    }

    if (!is2d) this.createWallMesh();
  }

  /*
   * Generate the mesh for the walls from outlines
   */
  createWallMesh() {
    this.calculateMeshOutlines();

    // [PVector]
    this.wallVerticies = [];
    // [Integer]
    this.wallTriangles = [];

    for (const outline of this.outlines) {
      for (let i = 0; i < outline.length - 1; i++) {
        const startIndex = this.wallVerticies.length;
        this.wallVerticies.push(this.verticies[outline[i]]); // left
        this.wallVerticies.push(this.verticies[outline[i + 1]]); // right
        this.wallVerticies.push(
          p5.Vector.sub(
            this.verticies[outline[i]],
            createVector(0, 0, this.wallHeight)
          )
        ); // bottom left
        this.wallVerticies.push(
          p5.Vector.sub(
            this.verticies[outline[i + 1]],
            createVector(0, 0, this.wallHeight)
          )
        ); // bottom left

        this.wallTriangles.push(startIndex + 0); // top left
        this.wallTriangles.push(startIndex + 2); // bottom left
        this.wallTriangles.push(startIndex + 3); // bottom right

        this.wallTriangles.push(startIndex + 3); // bottom right
        this.wallTriangles.push(startIndex + 1); // top right
        this.wallTriangles.push(startIndex + 0); // top left
      }
    }
  }

  triangulateSquare(square) {
    switch (square.configuration) {
      case 0:
        break;

      // 1 point:
      case 1:
        this.meshFromPoints(
          square.centerLeft,
          square.centerBottom,
          square.bottomLeft
        );
        break;
      case 2:
        this.meshFromPoints(
          square.bottomRight,
          square.centerBottom,
          square.centerRight
        );
        break;
      case 4:
        this.meshFromPoints(
          square.topRight,
          square.centerRight,
          square.centerTop
        );
        break;
      case 8:
        this.meshFromPoints(
          square.topLeft,
          square.centerTop,
          square.centerLeft
        );
        break;

      // 2 point:
      case 3:
        this.meshFromPoints(
          square.centerRight,
          square.bottomRight,
          square.bottomLeft,
          square.centerLeft
        );
        break;
      case 6:
        this.meshFromPoints(
          square.centerTop,
          square.topRight,
          square.bottomRight,
          square.centerBottom
        );
        break;
      case 9:
        this.meshFromPoints(
          square.topLeft,
          square.centerTop,
          square.centerBottom,
          square.bottomLeft
        );
        break;
      case 12:
        this.meshFromPoints(
          square.topLeft,
          square.topRight,
          square.centerRight,
          square.centerLeft
        );
        break;
      case 5:
        this.meshFromPoints(
          square.centerTop,
          square.topRight,
          square.centerRight,
          square.centerBottom,
          square.bottomLeft,
          square.centerLeft
        );
        break;
      case 10:
        this.meshFromPoints(
          square.topLeft,
          square.centerTop,
          square.centerRight,
          square.bottomRight,
          square.centerBottom,
          square.centerLeft
        );
        break;

      // 3 point:
      case 7:
        this.meshFromPoints(
          square.centerTop,
          square.topRight,
          square.bottomRight,
          square.bottomLeft,
          square.centerLeft
        );
        break;
      case 11:
        this.meshFromPoints(
          square.topLeft,
          square.centerTop,
          square.centerRight,
          square.bottomRight,
          square.bottomLeft
        );
        break;
      case 13:
        this.meshFromPoints(
          square.topLeft,
          square.topRight,
          square.centerRight,
          square.centerBottom,
          square.bottomLeft
        );
        break;
      case 14:
        this.meshFromPoints(
          square.topLeft,
          square.topRight,
          square.bottomRight,
          square.centerBottom,
          square.centerLeft
        );
        break;

      // 4 point:
      case 15:
        this.meshFromPoints(
          square.topLeft,
          square.topRight,
          square.bottomRight,
          square.bottomLeft
        );
        this.checkedVerticies[square.topLeft.vertexIndex] = true;
        this.checkedVerticies[square.topRight.vertexIndex] = true;
        this.checkedVerticies[square.bottomRight.vertexIndex] = true;
        this.checkedVerticies[square.bottomLeft.vertexIndex] = true;
        break;
    }
  }

  meshFromPoints() {
    const points = [...arguments];

    this.assignVerticies(points);

    if (points.length >= 3)
      this.createTriangle(points[0], points[1], points[2]);
    if (points.length >= 4)
      this.createTriangle(points[0], points[2], points[3]);
    if (points.length >= 5)
      this.createTriangle(points[0], points[3], points[4]);
    if (points.length >= 6)
      this.createTriangle(points[0], points[4], points[5]);
  }

  assignVerticies(points) {
    for (let i = 0; i < points.length; i++) {
      if (points[i].vertexIndex === -1)
        points[i].vertexIndex = this.verticies.length;
      this.verticies.push(points[i].position);
    }
  }

  createTriangle(a, b, c) {
    this.triangles.push(a.vertexIndex);
    this.triangles.push(b.vertexIndex);
    this.triangles.push(c.vertexIndex);

    if (a === 6 || b === 6 || c === 6) console.log(a, b, c);

    const triangle = new Triangle(a.vertexIndex, b.vertexIndex, c.vertexIndex);
    this.addTriangleToDictionary(triangle.vertexIndexA, triangle);
    this.addTriangleToDictionary(triangle.vertexIndexB, triangle);
    this.addTriangleToDictionary(triangle.vertexIndexC, triangle);
  }

  /**
   * Goes through mesh verticies list and follows outlines for the walls
   */
  calculateMeshOutlines() {
    for (
      let vertexIndex = 0;
      vertexIndex < this.verticies.length;
      vertexIndex++
    ) {
      if (!this.checkedVerticies[vertexIndex]) {
        let newOutlineVertex = this.getConnectedOutlineVertex(vertexIndex);
        if (newOutlineVertex !== -1) {
          this.checkedVerticies[vertexIndex] = true;

          const newOutline = [vertexIndex];
          this.outlines.push(newOutline);
          this.followOutline(newOutlineVertex, this.outlines.length - 1);
          this.outlines[this.outlines.length - 1].push(vertexIndex);
        }
      }
    }
  }

  /**
   * Follows the outline starting at the given index
   *
   * @param {integer} vertexIndex - The Vertex Index
   * @param {integer} outlineIndex - The Outline Index
   */
  followOutline(vertexIndex, outlineIndex) {
    this.outlines[outlineIndex].push(vertexIndex);
    this.checkedVerticies[vertexIndex] = true;

    const nextVertexIndex = this.getConnectedOutlineVertex(vertexIndex);

    if (nextVertexIndex !== -1) {
      this.followOutline(nextVertexIndex, outlineIndex);
    }
  }

  /**
   * @param {integer} vertexIndex - A Vertex Index
   * @return {integer} The vertex index of the connected outline edge. -1 if none is found.
   */
  getConnectedOutlineVertex(vertexIndex) {
    const trianglesContainingVertex = this.triangleDictionary[vertexIndex];
    if (!trianglesContainingVertex) return -1;

    for (let i = 0; i < trianglesContainingVertex.length; i++) {
      const triangle = trianglesContainingVertex[i];

      for (let j = 0; j < 3; j++) {
        const vertexB = triangle.verticies[j];
        if (vertexB !== vertexIndex && !this.checkedVerticies[vertexB]) {
          if (this.isOutlineEdge(vertexIndex, vertexB)) return vertexB;
        }
      }
    }

    return -1;
  }

  /**
   * @param {integer} vertexA - One Vertex Index
   * @param {integer} vertexB - A Second Vertex Index
   * @return {boolean} If the edge is an outline edge
   */
  isOutlineEdge(vertexA, vertexB) {
    const trianglesContainingVertexA = this.triangleDictionary[vertexA];
    let sharedTriangleCount = 0;

    for (let i = 0; i < trianglesContainingVertexA.length; i++) {
      if (trianglesContainingVertexA[i].contains(vertexB))
        sharedTriangleCount++;
      if (sharedTriangleCount > 1) break;
    }

    return sharedTriangleCount === 1;
  }

  addTriangleToDictionary(vertexIndexKey, triangle) {
    if (vertexIndexKey === 6) console.log('triangle');
    if (this.triangleDictionary[vertexIndexKey]) {
      this.triangleDictionary[vertexIndexKey].push(triangle);
    } else {
      this.triangleDictionary[vertexIndexKey] = [triangle];
    }
  }

  displayMesh() {
    // Show all triangles
    // stroke(0);
    // strokeWeight(1);
    // Hide all triangles
    noStroke();

    // Display cave surface
    fill(46);
    for (let i = 0; i < this.triangles.length; i += 3) {
      const a = this.verticies[this.triangles[i]];
      const b = this.verticies[this.triangles[i + 1]];
      const c = this.verticies[this.triangles[i + 2]];
      beginShape();
      vertex(a.x, a.y, a.z);
      vertex(b.x, b.y, b.z);
      vertex(c.x, c.y, c.z);
      endShape(CLOSE);
    }

    push();
    noStroke();
    translate(this.squareSize / 2, this.squareSize / 2, -wallHeight);
    fill(140);
    plane(width, height);
    pop();

    if (!is2d) {
      // Display cave walls
      fill(30);
      for (let i = 0; i < this.wallTriangles.length; i += 3) {
        const a = this.wallVerticies[this.wallTriangles[i]];
        const b = this.wallVerticies[this.wallTriangles[i + 1]];
        const c = this.wallVerticies[this.wallTriangles[i + 2]];
        beginShape();
        vertex(a.x, a.y, a.z);
        vertex(b.x, b.y, b.z);
        vertex(c.x, c.y, c.z);
        endShape(CLOSE);
      }

      // Display border walls
      beginShape();
      vertex(
        -width / 2 + this.squareSize / 2,
        -height / 2 + this.squareSize / 2,
        0
      );
      vertex(
        -width / 2 + this.squareSize / 2,
        -height / 2 + this.squareSize / 2,
        -this.wallHeight
      );
      vertex(
        -width / 2 + this.squareSize / 2,
        height / 2 + this.squareSize / 2,
        -this.wallHeight
      );
      vertex(
        -width / 2 + this.squareSize / 2,
        height / 2 + this.squareSize / 2,
        0
      );
      endShape();
      beginShape();
      vertex(
        width / 2 + this.squareSize / 2,
        -height / 2 + this.squareSize / 2,
        0
      );
      vertex(
        width / 2 + this.squareSize / 2,
        -height / 2 + this.squareSize / 2,
        -this.wallHeight
      );
      vertex(
        width / 2 + this.squareSize / 2,
        height / 2 + this.squareSize / 2,
        -this.wallHeight
      );
      vertex(
        width / 2 + this.squareSize / 2,
        height / 2 + this.squareSize / 2,
        0
      );
      endShape();
      beginShape();
      vertex(
        -width / 2 + this.squareSize / 2,
        -height / 2 + this.squareSize / 2,
        0
      );
      vertex(
        -width / 2 + this.squareSize / 2,
        -height / 2 + this.squareSize / 2,
        -this.wallHeight
      );
      vertex(
        width / 2 + this.squareSize / 2,
        -height / 2 + this.squareSize / 2,
        -this.wallHeight
      );
      vertex(
        width / 2 + this.squareSize / 2,
        -height / 2 + this.squareSize / 2,
        0
      );
      endShape();
      beginShape();
      vertex(
        -width / 2 + this.squareSize / 2,
        height / 2 + this.squareSize / 2,
        0
      );
      vertex(
        -width / 2 + this.squareSize / 2,
        height / 2 + this.squareSize / 2,
        -this.wallHeight
      );
      vertex(
        width / 2 + this.squareSize / 2,
        height / 2 + this.squareSize / 2,
        -this.wallHeight
      );
      vertex(
        width / 2 + this.squareSize / 2,
        height / 2 + this.squareSize / 2,
        0
      );
      endShape();
    }
  }

  display() {
    if (this.squareGrid) {
      for (let x = 0; x < this.squareGrid.squares.length - 1; x++) {
        for (let y = 0; y < this.squareGrid.squares[0].length - 1; y++) {
          let pos;
          push();
          fill(this.squareGrid.squares[x][y].topLeft.active ? 255 : 0);
          pos = this.squareGrid.squares[x][y].topLeft.position;
          translate(pos.x, pos.y, pos.z);
          box(this.squareSize * 0.4);
          pop();
          push();
          fill(this.squareGrid.squares[x][y].topRight.active ? 255 : 0);
          pos = this.squareGrid.squares[x][y].topRight.position;
          translate(pos.x, pos.y, pos.z);
          box(this.squareSize * 0.4);
          pop();
          push();
          fill(this.squareGrid.squares[x][y].bottomRight.active ? 255 : 0);
          pos = this.squareGrid.squares[x][y].bottomRight.position;
          translate(pos.x, pos.y, pos.z);
          box(this.squareSize * 0.4);
          pop();
          push();
          fill(this.squareGrid.squares[x][y].bottomLeft.active ? 255 : 0);
          pos = this.squareGrid.squares[x][y].bottomLeft.position;
          translate(pos.x, pos.y, pos.z);
          box(this.squareSize * 0.4);
          pop();

          push();
          fill(80);
          pos = this.squareGrid.squares[x][y].centerTop.position;
          translate(pos.x, pos.y, pos.z);
          box(this.squareSize * 0.15);
          pop();
          push();
          fill(80);
          pos = this.squareGrid.squares[x][y].centerRight.position;
          translate(pos.x, pos.y, pos.z);
          box(this.squareSize * 0.15);
          pop();
          push();
          fill(80);
          pos = this.squareGrid.squares[x][y].centerBottom.position;
          translate(pos.x, pos.y, pos.z);
          box(this.squareSize * 0.15);
          pop();
          push();
          fill(80);
          pos = this.squareGrid.squares[x][y].centerLeft.position;
          translate(pos.x, pos.y, pos.z);
          box(this.squareSize * 0.15);
          pop();
        }
      }
    }
  }
}
