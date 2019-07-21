let mapGenerator;
let player;

// Customize Cave
const mapWidth = 128;
const mapHeight = 74;
const borderSize = 1;
let squareSize = 10;
const wallThresholdSize = 100;
const roomThresholdSize = 100;
const fillPercent = 50;
const wallHeight = 20;
const passagewaySize = 2;
const seed = '1563691289358';
const useRandomSeed = true;
const is2d = true;
const isOrbitControl = true;
const isFullscreen = true;
const isDebug = false;

// Customize Player
const playerSize = 4;
const playerSpeed = 4;

function setup() {
  if (isFullscreen) squareSize = windowWidth / (mapWidth + 1);
  console.log(
    `Map Width: ${mapWidth} | Map Height: ${mapHeight} | Wall Threshold: ${wallThresholdSize} | Room Threshold: ${roomThresholdSize}`
  );

  createCanvas(
    squareSize * (mapWidth + borderSize * 2 - 1),
    squareSize * (mapHeight + borderSize * 2 - 1),
    WEBGL
  );
  // console.log(width);
  if (is2d) ortho();
  else camera(0, height, height, 0, 0, 0, 0, 1, 0);
  mapGenerator = new MapGenerator(
    seed,
    useRandomSeed,
    squareSize,
    mapWidth,
    mapHeight,
    fillPercent,
    borderSize,
    wallHeight,
    wallThresholdSize,
    roomThresholdSize,
    passagewaySize
  );
  mapGenerator.generateMap();

  player = new Player(playerSize, playerSpeed);
}

function draw() {
  if (!is2d && isOrbitControl) orbitControl();
  background(0);
  translate(-squareSize / 2, -squareSize / 2);
  mapGenerator.meshGen.displayMesh();
  if (isDebug) mapGenerator.displayDebugLines();
  if (keyIsDown(LEFT_ARROW)) player.move(-1, 0);
  if (keyIsDown(RIGHT_ARROW)) player.move(1, 0);
  if (keyIsDown(UP_ARROW)) player.move(0, -1);
  if (keyIsDown(DOWN_ARROW)) player.move(0, 1);
  player.update();
  player.display();
}

function mousePressed() {
  if (is2d || !isOrbitControl) mapGenerator.generateMap();
}

function initZeroArray(w, h) {
  const array = [];
  for (let i = 0; i < w; i++) {
    array[i] = [];
    for (let j = 0; j < h; j++) {
      array[i][j] = 0;
    }
  }
  return array;
}
