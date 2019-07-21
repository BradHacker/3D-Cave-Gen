class Coord {
  constructor(x, y) {
    this.tileX = x;
    this.tileY = y;
  }
}

class Room {
  constructor(_id, roomTiles, map) {
    /*
     * @property {number} The id of the room
     */
    this.id = _id;
    if (roomTiles && map) {
      /*
       * @property {Coord[]} The array of tiles in the room
       */
      this.tiles = roomTiles;
      /*
       * @property {number} The amount of tiles in the room
       */
      this.roomSize = roomTiles.length;
      /*
       * @property {Room[]} The array of connected rooms
       */
      this.connectedRooms = [];
      /*
       * @property {Coord[]} The array of tiles on the edge of the room
       */
      this.edgeTiles = [];

      for (const tile of this.tiles) {
        for (let x = tile.tileX - 1; x <= tile.tileX + 1; x++) {
          for (let y = tile.tileY - 1; y <= tile.tileY + 1; y++) {
            if (x === tile.tileX || y === tile.tileY) {
              if (map[x][y] === 1) this.edgeTiles.push(tile);
            }
          }
        }
      }
    }

    this.isAccessibleFromMainRoom = false;
    this.isMainRoom = false;
  }

  setAccessibleFromMainRoom() {
    if (!this.isAccessibleFromMainRoom) {
      this.isAccessibleFromMainRoom = true;
      for (const connectedRoom of this.connectedRooms) {
        connectedRoom.setAccessibleFromMainRoom();
      }
    }
  }

  /*
   * @param {Room} roomA - The first room
   * @param {Room} roomB - The second room
   */
  static connectRooms(roomA, roomB) {
    if (roomA.isAccessibleFromMainRoom) roomB.setAccessibleFromMainRoom();
    else if (roomB.isAccessibleFromMainRoom) roomA.setAccessibleFromMainRoom();

    roomA.connectedRooms.push(roomB);
    roomB.connectedRooms.push(roomA);
  }

  /*
   * @param {Room} otherRoom - The other room
   */
  isConnectedTo(otherRoom) {
    return this.connectedRooms.filter(r => r.id === otherRoom.id).length > 0;
  }

  compareTo(otherRoom) {
    return otherRoom.roomSize - this.roomSize;
  }
}

class MapGenerator {
  constructor(
    _seed,
    _useRandomSeed,
    _cellSize,
    _mapWidth,
    _mapHeight,
    _fillPercent,
    _borderSize,
    _wallHeight,
    _wallThresholdSize,
    _roomThresholdSize,
    _passagewaySize
  ) {
    this.useRandomSeed = _useRandomSeed;
    this.cellSize = _cellSize;
    this.mapWidth = _mapWidth;
    this.mapHeight = _mapHeight;
    this.fillPercent = _fillPercent;
    this.borderSize = _borderSize;
    this.wallHeight = _wallHeight;
    this.wallThresholdSize = _wallThresholdSize;
    this.roomThresholdSize = _roomThresholdSize;
    this.seed = _seed;
    this.passagewaySize = _passagewaySize;
  }

  generateMap() {
    this.map = [];
    this.debugLines = [];

    this.randomFillMap();

    for (let i = 0; i < 5; i++) {
      this.smoothMap();
    }

    this.processMap();

    this.borderedMap = [];
    for (let x = 0; x < this.map.length + this.borderSize * 2; x++) {
      this.borderedMap[x] = [];
      for (let y = 0; y < this.map[0].length + this.borderSize * 2; y++) {
        if (
          x >= this.borderSize &&
          x < this.mapWidth + this.borderSize &&
          y >= this.borderSize &&
          y < this.mapHeight + this.borderSize
        ) {
          this.borderedMap[x][y] = this.map[x - this.borderSize][
            y - this.borderSize
          ];
        } else {
          this.borderedMap[x][y] = 1;
        }
      }
    }

    this.meshGen = new MeshGenerator(this.wallHeight);
    this.meshGen.generateMesh(this.borderedMap, this.cellSize);
  }

  processMap() {
    console.log('processing | Processing the map...');
    // Remove walls smaller than wall threshold
    const wallRegions = this.getRegions(1);
    for (const wallRegion of wallRegions) {
      if (wallRegion.length < this.wallThresholdSize) {
        for (const tile of wallRegion) {
          this.map[tile.tileX][tile.tileY] = 0;
        }
      }
    }
    console.log(`processing | ${wallRegions.length} wall regions found`);

    // Remove walls smaller than wall threshold
    const roomRegions = this.getRegions(0);
    const survivingRooms = [];
    for (let i = 0; i < roomRegions.length; i++) {
      const roomRegion = roomRegions[i];
      if (roomRegion.length < this.roomThresholdSize) {
        for (const tile of roomRegion) {
          this.map[tile.tileX][tile.tileY] = 1;
        }
      } else {
        survivingRooms.push(new Room(i, roomRegion, this.map));
      }
    }
    console.log(`processing | ${survivingRooms.length} room regions found`);

    if (survivingRooms.length > 0) {
      survivingRooms.sort((a, b) => a.compareTo(b));
      survivingRooms[0].isMainRoom = true;
      survivingRooms[0].isAccessibleFromMainRoom = true;

      this.connectClosestRooms(survivingRooms);
    }
  }

  /*
   * @param {Room[]} allRooms - An array of all rooms on the map
   */
  connectClosestRooms(allRooms, forceAccessibilityFromMainRoom) {
    console.log('connecting | Connecting rooms...');
    let roomListA = [];
    let roomListB = [];

    if (forceAccessibilityFromMainRoom) {
      for (const room of allRooms) {
        if (room.isAccessibleFromMainRoom) roomListB.push(room);
        else roomListA.push(room);
      }
    } else {
      roomListA = allRooms;
      roomListB = allRooms;
    }

    let bestDistance = 0;
    let bestTileA = new Coord();
    let bestTileB = new Coord();
    let bestRoomA = new Room();
    let bestRoomB = new Room();
    let possibleConnectionFound = false;

    console.log(
      `connecting | possible connections: ${roomListA.length *
        roomListB.length}`
    );

    let connectionNum = 0;

    for (const roomA of roomListA) {
      if (!forceAccessibilityFromMainRoom) {
        possibleConnectionFound = false;

        if (roomA.connectedRooms.length > 0) continue;
      }

      for (const roomB of roomListB) {
        if (roomA.id === roomB.id || roomA.isConnectedTo(roomB)) continue;
        connectionNum++;
        console.log(
          `connecting | connection number: ${connectionNum}/${roomListA.length *
            roomListB.length}, connecting room ${roomA.id} to room ${roomB.id}`
        );
        for (
          let tileIndexA = 0;
          tileIndexA < roomA.edgeTiles.length;
          tileIndexA++
        ) {
          for (
            let tileIndexB = 0;
            tileIndexB < roomB.edgeTiles.length;
            tileIndexB++
          ) {
            const tileA = roomA.edgeTiles[tileIndexA];
            const tileB = roomB.edgeTiles[tileIndexB];
            const distanceBetweenRooms =
              Math.pow(tileA.tileX - tileB.tileX, 2) +
              Math.pow(tileA.tileY - tileB.tileY, 2);

            if (
              distanceBetweenRooms < bestDistance ||
              !possibleConnectionFound
            ) {
              bestDistance = distanceBetweenRooms;
              possibleConnectionFound = true;
              bestTileA = tileA;
              bestTileB = tileB;
              bestRoomA = roomA;
              bestRoomB = roomB;
            }
          }
        }
      }

      if (possibleConnectionFound && !forceAccessibilityFromMainRoom)
        this.createPassage(bestRoomA, bestRoomB, bestTileA, bestTileB);
    }

    if (possibleConnectionFound && forceAccessibilityFromMainRoom) {
      this.createPassage(bestRoomA, bestRoomB, bestTileA, bestTileB);
      this.connectClosestRooms(allRooms, true);
    }

    if (!forceAccessibilityFromMainRoom) {
      this.connectClosestRooms(allRooms, true);
    }
  }

  createPassage(roomA, roomB, tileA, tileB) {
    Room.connectRooms(roomA, roomB);
    const posA = this.coordToWorldPoint(tileA);
    const posB = this.coordToWorldPoint(tileB);
    this.debugLines.push([posA, posB]);

    const line = this.getLine(tileA, tileB);
    for (const c of line) {
      this.drawCircle(c, this.passagewaySize);
    }
  }

  drawCircle(c, r) {
    for (let x = -r; x <= r; x++) {
      for (let y = -r; y <= r; y++) {
        if (x * x + y * y <= r * r) {
          let drawX = c.tileX + x;
          let drawY = c.tileY + y;
          if (this.isInMapRange(drawX, drawY)) {
            this.map[drawX][drawY] = 0;
          }
        }
      }
    }
  }

  getLine(fromTile, toTile) {
    const line = [];

    let x = fromTile.tileX;
    let y = fromTile.tileY;

    let dx = toTile.tileX - fromTile.tileX;
    let dy = toTile.tileY - fromTile.tileY;

    let inverted = false;
    let step = dx >= 0 ? 1 : -1;
    let gradientStep = dy >= 0 ? 1 : -1;

    let longest = abs(dx);
    let shortest = abs(dy);

    if (longest < shortest) {
      inverted = true;
      longest = abs(dy);
      shortest = abs(dx);

      step = dy >= 0 ? 1 : -1;
      gradientStep = dx >= 0 ? 1 : -1;
    }

    let gradientAccumulation = longest / 2;
    for (let i = 0; i < longest; i++) {
      line.push(new Coord(x, y));

      if (inverted) y += step;
      else x += step;

      gradientAccumulation += shortest;
      if (gradientAccumulation > longest) {
        if (inverted) x += gradientStep;
        else y += gradientStep;

        gradientAccumulation -= longest;
      }
    }

    return line;
  }

  coordToWorldPoint(tile) {
    return createVector(
      -width / 2 + this.cellSize * 1.5 + tile.tileX * this.cellSize,
      -height / 2 + this.cellSize * 1.5 + tile.tileY * this.cellSize,
      0
    );
  }

  /*
   * Returns an array of regions of given tileType
   *
   * @param {number} tileType - The type of region to look for
   * @return {array[]} Array of coordinate arrays (regions)
   */
  getRegions(tileType) {
    console.log(`finding    | Finding regions of type ${tileType}...`);
    const regions = [];
    const mapFlags = initZeroArray(this.map.length, this.map[0].length);
    // console.log(mapFlags);

    for (let x = 0; x < this.map.length; x++) {
      // mapFlags[x] = [];
      for (let y = 0; y < this.map[0].length; y++) {
        if (mapFlags[x][y] === 0 && this.map[x][y] === tileType) {
          const newRegion = this.getRegionTiles(x, y);
          regions.push(newRegion);

          for (const tile of newRegion) {
            mapFlags[tile.tileX][tile.tileY] = 1;
          }
        }
      }
    }

    return regions;
  }

  /*
   * @param {number} startX - The starting X coordinate
   * @param {number} startY - The starting Y coordinate
   * @return {array} Array of coordinates in region
   */
  getRegionTiles(startX, startY) {
    const tiles = [];
    const mapFlags = initZeroArray(this.map.length, this.map[0].length);
    let tileType = this.map[startX][startY];
    const queue = [];
    queue.push(new Coord(startX, startY));
    mapFlags[startX][startY] = 1;

    while (queue.length > 0) {
      const tile = queue.shift();
      tiles.push(tile);

      for (let x = tile.tileX - 1; x <= tile.tileX + 1; x++) {
        for (let y = tile.tileY - 1; y <= tile.tileY + 1; y++) {
          if (
            this.isInMapRange(x, y) &&
            (x === tile.tileX || y === tile.tileY)
          ) {
            if (mapFlags[x][y] === 0 && this.map[x][y] === tileType) {
              mapFlags[x][y] = 1;
              queue.push(new Coord(x, y));
            }
          }
        }
      }
    }

    return tiles;
  }

  /*
   * Determines whether a tile is in the map
   *
   * @param {integer} x - The X coordinate
   * @param {integer} y - The Y coordinate
   * @return {boolean} True if tile is on map
   */
  isInMapRange(x, y) {
    return x >= 0 && x < this.map.length && y >= 0 && y < this.map[0].length;
  }

  randomFillMap() {
    console.log('filling    | Randomly filling the map...');
    if (this.useRandomSeed) this.seed = Date.now().toString();
    randomSeed(this.seed);
    console.log(`filling    | The seed for this cave is: ${this.seed}`);
    for (let x = 0; x < this.mapWidth; x++) {
      this.map[x] = [];
      for (let y = 0; y < this.mapHeight; y++) {
        if (
          x === 0 ||
          x > this.mapWidth - 2 ||
          y === 0 ||
          y > this.mapHeight - 2
        ) {
          this.map[x][y] = 1;
        } else {
          this.map[x][y] = random(100) < this.fillPercent ? 1 : 0;
        }
      }
    }
  }

  smoothMap() {
    console.log('smoothing  | Smoothing the map...');
    for (let x = 0; x < this.map.length; x++) {
      for (let y = 0; y < this.map[0].length; y++) {
        const wallCount = this.getNeighborWallCount(x, y);
        // console.log(x, y, wallCount);
        if (wallCount > 4) this.map[x][y] = 1;
        else if (wallCount < 4) this.map[x][y] = 0;
      }
    }
  }

  getNeighborWallCount(x, y) {
    let wallCount = 0;
    for (let neighborX = x - 1; neighborX <= x + 1; neighborX++) {
      for (let neighborY = y - 1; neighborY <= y + 1; neighborY++) {
        if (this.isInMapRange(neighborX, neighborY)) {
          if (neighborX !== x || neighborY !== y) {
            wallCount += this.map[neighborX][neighborY];
          }
        } else {
          wallCount++;
        }
      }
    }
    return wallCount;
  }

  displayDebugLines() {
    for (const debugLine of this.debugLines) {
      stroke(0, 255, 0);
      strokeWeight(1);
      beginShape(LINES);
      vertex(debugLine[0].x, debugLine[0].y, debugLine[0].z);
      vertex(debugLine[1].x, debugLine[1].y, debugLine[1].z);
      endShape();
    }
  }
}
