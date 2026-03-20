const MIDI_CC_MAP = {
  1: "seed", // K1 – composition seed (0–127 → seed value)
  2: "paletteIndex", // K2 – palette preset (0–3)
  3: "padding", // K3 – block padding (2–20)
  4: "borderRadius", // K4 – border radius (0–20)
  5: "animSpeed", // K5 – animation speed (0.01–0.3)
  6: "iconChoice", // K6 – icon: tension / warning (< 64 = tension)
  7: "nonHiddenRatio", // K7 – visible block ratio (0.3–1.0)
  8: "steps", // K8 – grid subdivision steps (2–5)
};

const params = {
  seed: 10,
  paletteIndex: 0,
  padding: 4,
  borderRadius: 4,
  animSpeed: 0.1,
  iconChoice: 0, // 0 = tension, 1 = warning
  nonHiddenRatio: 0.8,
  steps: 2,
};

// Knob raw values (0–127), for the UI panel
const knobValues = { 1: 10, 2: 0, 3: 20, 4: 20, 5: 40, 6: 0, 7: 100, 8: 10 };

let gridSpaceWidth = 800;
let gridSpaceHeight = 800;
const marginLeft = gridSpaceWidth * 0.1;
const marginTop = gridSpaceHeight * 0.1;
const gridWidth = gridSpaceWidth - marginLeft * 2;
const gridHeight = gridSpaceHeight - marginTop * 2;

let padding = 4;
let borderRadius = 4;

let palette = ["#fdd7d6", "#131313", "#5e5efc"];
let backgroundColor = "";
let randomIcon = "";
let machineNumber = 0;

function getIconColor(c) {
  return {
    "#fdd7d6": "blue",
    "#131313": "white",
    "#5e5efc": "black",
  }[c];
}

let frames_needed = 0;

function setRandomValues() {
  backgroundColor = random(shuffle(palette));
  randomIcon = random(shuffle(["tension", "warning", "text"]));
  machineNumber = int(random(0, 256));
  PULLEY_SPEED = random(0.01, 0.1);
  frames_needed = Math.round(TAU / PULLEY_SPEED);
  createFactories();
}

const colors = ["pink", "blue", "white", "black"];

const images = {
  tension: {
    pink: undefined,
    blue: undefined,
    white: undefined,
    black: undefined,
  },
  warning: {
    pink: undefined,
    blue: undefined,
    white: undefined,
    black: undefined,
  },
  text: {
    pink: undefined,
    blue: undefined,
    white: undefined,
    black: undefined,
  },
};

let overPassMono;

function preload() {
  ["tension", "warning", "text"].forEach((iconName) => {
    colors.forEach((iconColor) => {
      images[iconName][iconColor] = loadImage(
        `./images/${iconName}-${iconColor}.png`
      );
    });
  });
  overPassMono = loadFont("./overpass-mono.ttf");
}

const createFactory = (props) => {
  const {
    width,
    height,
    steps,
    subSteps,
    direction,
    padding = 4,
    factoryName = "factory",
  } = props;

  let grid = [];
  let minBlockSize = 24;
  let position = { x: 0, y: 0 };

  let total, secondaryTotal;
  let subStepPositionUpdate, stepPositionUpdate;
  let getSizeX, getSizeY;

  if (direction === "horizontal") {
    total = width;
    secondaryTotal = height;
    stepPositionUpdate = ({ x, y }, v) => ({ x: x + v, y: 0 });
    subStepPositionUpdate = ({ x, y }, v) => ({ x, y: y + v });
    getSizeX = (main, secondary) => main;
    getSizeY = (main, secondary) => secondary;
  }

  if (direction === "vertical") {
    total = height;
    secondaryTotal = width;
    stepPositionUpdate = ({ x, y }, v) => ({ x: 0, y: y + v });
    subStepPositionUpdate = ({ x, y }, v) => ({ x: x + v, y });
    getSizeX = (main, secondary) => secondary;
    getSizeY = (main, secondary) => main;
  }

  let mainBudget = total - padding * (steps - 1);

  let mainSize, secondarySize;

  for (let i = 0; i < steps; i++) {
    grid[i] = [];

    mainSize =
      i === steps - 1
        ? mainBudget
        : floor(
            random(
              minBlockSize,
              Math.max(mainBudget - minBlockSize * (steps - i), minBlockSize)
            )
          );

    let secondaryBudget = secondaryTotal - padding * (subSteps - 1);

    for (let j = 0; j < subSteps; j++) {
      secondarySize =
        j === subSteps - 1
          ? secondaryBudget
          : floor(
              random(
                minBlockSize,
                Math.max(
                  secondaryBudget - minBlockSize * (subSteps - j),
                  minBlockSize
                )
              )
            );

      const bloque = new Block(
        position.x,
        position.y,
        getSizeX(mainSize, secondarySize),
        getSizeY(mainSize, secondarySize),
        `${factoryName}-${i}-${j}`
      );

      grid[i][j] = bloque;

      position = subStepPositionUpdate(position, secondarySize + padding);
      secondaryBudget -= secondarySize;
    }
    position = stepPositionUpdate(position, mainSize + padding);
    mainBudget -= mainSize;
  }

  return grid;
};

function getBlockCoords(block) {
  const id = block.id;
  const [name, ...coords] = id.split("-");
  const [fx, fy, bi, bj] = coords.map((x) => Number(x));
  return [name, fx, fy, bi, bj];
}

function getPrevBlock(block) {
  const [name, fx, fy, bi, bj] = getBlockCoords(block);

  const notFirst = bj > 0;
  const blockFactoryConfig = factoryGrid[Number(fx)][Number(fy)];
  const configKey = name.includes("meta") ? "metaFactory" : "factory";
  if (notFirst) {
    return blockFactoryConfig[configKey][bi][bj - 1];
  }
  return undefined;
}

function getNextBlock(block) {
  const [name, fx, fy, bi, bj] = getBlockCoords(block);

  const blockFactoryConfig = factoryGrid[Number(fx)][Number(fy)];
  const configKey = name.includes("meta") ? "metaFactory" : "factory";
  const levelConfig = blockFactoryConfig[configKey][bi];
  const notLast = bj < levelConfig.length - 1;
  if (notLast) {
    return blockFactoryConfig[configKey][bi][bj + 1];
  }
  return undefined;
}

const getBlockSize = (block) => {
  return block.props.w * block.props.h;
};

const getBiggest = (blocks) => {
  return blocks.reduce((prev, curr) => {
    return getBlockSize(prev) > getBlockSize(curr) ? prev : curr;
  });
};

const getBiggestBlock = (grid) => {
  const blocks = grid.flat();
  return getBiggest(blocks);
};

let factoryGrid = [];

const NAILS_PADDING = 4;
const NAIL_SIZE = 10;
const NUMBER_OF_NAILS = 0;

const CABLES_PADDING = 20;
const CABLES_DELTAS = [-CABLES_PADDING, 0, CABLES_PADDING];
const CABLE_LENGTH = 12;
const CABLE_PLUG_SIZE = 10;
const NUMBER_OF_CABLES = 0;

const NUMBER_OF_ANIMATED_BLOCKS = 3;

const NUMBER_OF_PULLY_CABLES = 1;

const FACTORY_HIDDEN_RATIO = 0.1;
const METAFACTORY_HIDDEN_RATIO = 0.4;

const PULLEY_FACTOR = 1.1;
const PULLEY_WIDTH = 20;
let PULLEY_SPEED = 0;

function createFactories() {
  const r = 2;
  const c = 2;
  for (let i = 0; i < c; i++) {
    factoryGrid[i] = [];

    for (let j = 0; j < r; j++) {
      const w = gridWidth / c;
      const h = gridHeight / r;

      const dx = i * w + (i - 1) * padding;
      const dy = j * h + (j - 1) * padding;

      let factory = createFactory({
        width: w,
        height: h,
        steps: 2,
        subSteps: 4,
        direction: "horizontal",
        factoryName: `factory-${i}-${j}`,
      });

      const biggest = getBiggestBlock(factory);
      biggest.props.c = "#d1d1d1";
      biggest.type = "meta";

      const {
        props: { x, y, w: nw, h: nh, id },
      } = biggest;

      let metaFactory = createFactory({
        width: nw,
        height: nh,
        steps: 4,
        subSteps: 4,
        direction: "vertical",
        factoryName: `metaFactory-${i}-${j}`,
      });

      factoryGrid[i][j] = { factory, metaFactory, dx, dy, x, y };
    }
  }

  factoryGrid.flat().forEach((f) => {
    f.factory.flat().forEach((b) => {
      if (b.type !== "meta" && random() > 1 - FACTORY_HIDDEN_RATIO) {
        b.type = "hidden";
      }
    });
    f.metaFactory.flat().forEach((b) => {
      if (random() > 1 - METAFACTORY_HIDDEN_RATIO) {
        b.type = "hidden";
      }
    });
  });

  const everyBlock = factoryGrid
    .flat()
    .flatMap((f) => [f.factory, f.metaFactory])
    .flat(2)
    .filter((b) => b.type !== "hidden");

  const biggestOfAll = getBiggest(
    everyBlock.filter((b) => b.type === "initial")
  );
  biggestOfAll.type = "biggest";

  const nonMetaBlocks = everyBlock.filter(
    (block) => block.type !== "meta" && block.type !== "biggest"
  );

  const nailsSuitableBlocks = nonMetaBlocks.filter((block) => {
    const sizeTarget = (NAIL_SIZE * 2 + NAILS_PADDING * 2) * 1.5;
    return (block.props.w > sizeTarget) & (block.props.h > sizeTarget);
  });

  if (nailsSuitableBlocks.length > 0) {
    Array.from({ length: NUMBER_OF_NAILS })
      .map(() => int(random(0, nailsSuitableBlocks.length)))
      .forEach((i) => {
        nailsSuitableBlocks[i].type = "nails";
      });
  }

  const nonMetaNailsBlocks = nonMetaBlocks.filter((b) => b.type !== "nails");

  const cableSuitableBlocks = nonMetaNailsBlocks.filter((b) => {
    const sizeTarget =
      (CABLE_PLUG_SIZE * CABLES_DELTAS.length +
        CABLES_PADDING * (CABLES_DELTAS.length - 1)) *
      1.5;
    const secondarySizeTarget =
      ((CABLE_LENGTH - padding) / 2 + CABLE_PLUG_SIZE) * 2 + padding;

    const prevBlock = getPrevBlock(b);
    const prevInitial = prevBlock && prevBlock.type === "initial";

    if (b.id.includes("meta")) {
      return (
        prevInitial &&
        b.props.w > secondarySizeTarget &&
        b.props.h > sizeTarget &&
        prevBlock.props.w > secondarySizeTarget &&
        prevBlock.props.h > sizeTarget
      );
    } else {
      return (
        prevInitial &&
        b.props.h > secondarySizeTarget &&
        b.props.w > sizeTarget &&
        prevBlock.props.h > secondarySizeTarget &&
        prevBlock.props.w > sizeTarget
      );
    }
  });

  if (cableSuitableBlocks.length > 0) {
    Array.from({ length: NUMBER_OF_CABLES })
      .map(() => int(random(0, cableSuitableBlocks.length)))
      .forEach((i) => {
        cableSuitableBlocks[i].type = "cables";
        const prev = getPrevBlock(cableSuitableBlocks[i]);
        prev.type = "cables_prev";
      });
  }

  const animatable = everyBlock.filter((b) => {
    const next = getNextBlock(b);
    const prev = getPrevBlock(b);
    // let hasSpace = !next || (next.type === "hidden" && prev && prev.type === "hidden");
    let hasSpace = prev && prev.type === "hidden";
    return b.type === "initial" && hasSpace;
  });

  if (animatable.length > 0) {
    Array.from({ length: NUMBER_OF_ANIMATED_BLOCKS })
      .map(() => int(random(0, animatable.length)))
      .forEach((i) => {
        animatable[i].type = "animated";
      });
  }

  const pulleyEndSuitable = everyBlock.filter((b) => {
    return b.type === "initial";
  });

  if (pulleyEndSuitable.length > 0) {
    Array.from({ length: NUMBER_OF_PULLY_CABLES })
      .map(() => int(random(0, pulleyEndSuitable.length)))
      .forEach((i) => {
        pulleyEndSuitable[i].type = "pulley_end";
      });
  }

  const possibleSquarer = everyBlock.filter(
    (b) => b.type === "initial" && getBlockSize(b) > 100 * 100
  );

  if (possibleSquarer.length > 0) {
    const squarerBlock = possibleSquarer.reduce((prev, curr) => {
      return Math.abs(1 - prev.props.w / prev.props.h) <
        Math.abs(1 - curr.props.w / curr.props.h)
        ? prev
        : curr;
    });
    if (squarerBlock) {
      squarerBlock.type = "icon";
    }
  }

  const labelBlock = everyBlock.find(
    (b) =>
      b.type === "initial" &&
      b.props.w > 100 &&
      b.props.h > 4 * padding + 2 * 14
  );
  if (labelBlock) {
    labelBlock.type = "label";
  }
}

function drawComposition() {
  background(backgroundColor);
  push();
  translate((width - gridSpaceWidth) / 2, (height - gridSpaceHeight) / 2);
  factoryGrid.flat().forEach((config) => {
    const { dx, dy, x, y, factory, metaFactory } = config;
    push();
    translate(marginLeft + dx, marginTop + dy);
    circle(0, 0, 20)
    factory.flat().forEach((_) => _.display());
    translate(x, y);
    circle(0, 0, 10)
    metaFactory.flat().forEach((_) => _.display());
    pop();
  });

  factoryGrid.flat().forEach((config) => {
    const { dx, dy, x, y, factory, metaFactory } = config;
    push();
    translate(marginLeft + dx, marginTop + dy);
    factory
      .flat()
      .filter((b) => b.type === "biggest")
      .forEach((_) => _.display());
    translate(x, y);
    metaFactory
      .flat()
      .filter((b) => b.type === "biggest")
      .forEach((_) => _.display());
    pop();
  });

  let pulleyStart = { x: 0, y: 0 };
  let pulleyEnds = [];
  factoryGrid.flat().forEach((config) => {
    const { dx, dy, x, y, factory, metaFactory } = config;
    factory
      .flat()
      .filter((b) => b.type === "biggest")
      .forEach((b) => {
        pulleyStart.x = marginLeft + dx + b.pulley.ccx;
        pulleyStart.y = marginTop + dy + b.pulley.ccy;
      });
    metaFactory
      .flat()
      .filter((b) => b.type === "biggest")
      .forEach((b) => {
        pulleyStart.x = marginLeft + dx + b.pulley.ccx + x;
        pulleyStart.y = marginTop + dy + b.pulley.ccy + y;
      });

    factory
      .flat()
      .filter((b) => b.type === "pulley_end")
      .forEach((b) => {
        const pex = marginLeft + dx + b.props.x + b.props.w / 2;
        const pey = marginTop + dy + b.props.y + b.props.h / 2;
        pulleyEnds.push({ x: pex, y: pey });
      });
    metaFactory
      .flat()
      .filter((b) => b.type === "pulley_end")
      .forEach((b) => {
        const pex = marginLeft + dx + b.props.x + b.props.w / 2 + x;
        const pey = marginTop + dy + b.props.y + b.props.h / 2 + y;
        pulleyEnds.push({ x: pex, y: pey });
      });
  });

  stroke("#f4f4f4");
  strokeWeight(2);
  pulleyEnds.forEach((pulleyEnd) => {
    line(pulleyStart.x, pulleyStart.y, pulleyEnd.x, pulleyEnd.y);
  });
  pop();
}

let seed = 0;

function setup() {
  // createCanvas(window.innerWidth, window.innerHeight);
  createCanvas(800, 800);
  randomSeed(seed);
  setRandomValues();

  // Build panel and init MIDI after DOM ready
  setTimeout(() => {
    buildPanel();
    initMIDI();
  }, 100);
  // noLoop();
}

function newFactory() {
  seed += 1;
  cycle = 0;
  randomSeed(seed);
  setRandomValues();
  drawComposition();
  frameCount = 0;
  // loop();
}

function touchEnded() {
  newFactory();
}

function mouseClicked() {
  newFactory();
  // saveCanvas(`factory_${seed}_${width}x${height}`);
}

function keyPressed() {
  if (key == "n") {
    newFactory();
  }
  if (key == "s") {
    saveCanvas(`factory_${machineNumber}_${width}x${height}`);
  }
  if (key == "g") {
    let svg = "";
    factoryGrid.flat().forEach((config) => {
      const { dx, dy, x, y, factory, metaFactory } = config;
      push();
      factory.flat().forEach((_) => {
        const blockSvg = _.getSvg(marginLeft + dx, marginTop + dy);
        svg += blockSvg;
      });
      metaFactory.flat().forEach((_) => {
        const blockSvg = _.getSvg(marginLeft + dx + x, marginTop + dy + y);
        svg += blockSvg;
      });
      pop();
    });

    svg = `
    <svg width="800" height="800">
      <rect x="0" y="0" width="800" height="800" fill="${backgroundColor}"></rect>
      ${svg}
    </svg>`;

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bouba-print.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
let cycle = 0;
let post0 = true;

function draw() {
  drawComposition();
  if (Math.round((frameCount * PULLEY_SPEED) % TAU) == 0) {
    if (post0) {
      cycle = cycle + 1;
      post0 = false;
    }
  } else {
    post0 = true;
  }
  if (frameCount < frames_needed + 1) {
    // saveCanvas(`factory-${seed}-frame-${frameCount}.png`)
  } else {
    // noLoop();
  }
}

class Block {
  constructor(x, y, w, h, id) {
    const c = random(palette.filter((c) => c !== backgroundColor));
    this.id = id;
    this.props = { x, y, w, h, c, id };
    this.initialProps = { x, y, w, h, c, id };
    this.type = "initial";
    this.pulley = { ccx: 0, ccy: 0 };
  }

  getSvg(tx, ty) {
    const { x, y, w, h, c } = this.props;
    if (!["hidden", "meta"].includes(this.type)) {
      return `<rect rx="4" x="${tx + x}" y="${
        ty + y
      }" width="${w}" height="${h}" fill="${c}"></rect>`;
    } else {
      return "";
    }
  }

  display() {
    const { x, y, w, h, c } = this.props;

    const prevBlock = getPrevBlock(this);
    const nextBlock = getNextBlock(this);

    if (this.type === "animated") {
      if (this.id.includes("meta")) {
        let n_space = 0;
        let p_space = 0;
        /*
        if (nextBlock && nextBlock.type === 'hidden') {
          n_space += nextBlock.props.w + padding
        }
        */
        if (prevBlock && prevBlock.type === "hidden") {
          p_space += prevBlock.props.w + padding;
        }
        const dx = map(
          cos((knobValues["1"] / 127) * PI),
          -1,
          1,
          -p_space,
          n_space
        );
        this.props.x = this.initialProps.x + dx;
        stroke("#f4f4f4");
        strokeWeight(2);
        line(
          this.props.x + w / 2,
          this.props.y + h / 2,
          this.initialProps.x + w - padding,
          this.props.y + h / 2
        );
      } else {
        let n_space = 0;
        let p_space = 0;
        /*
        if (nextBlock && nextBlock.type === 'hidden') {
          n_space += nextBlock.props.h + padding
        }
        */
        if (prevBlock && prevBlock.type === "hidden") {
          p_space += prevBlock.props.h + padding;
        }
        const dy = map(
          cos((knobValues["2"] / 127) * PI),
          -1,
          1,
          -p_space,
          n_space
        );
        this.props.y = this.initialProps.y + dy;
        stroke("#f4f4f4");
        strokeWeight(2);
        line(
          this.props.x + w / 2,
          this.props.y + h / 2,
          this.props.x + w / 2,
          this.initialProps.y - p_space + padding
        );
      }
    }

    const xLeft = x + NAILS_PADDING + NAIL_SIZE / 2;
    const xRight = x + w - NAILS_PADDING - NAIL_SIZE / 2;
    const yTop = y + NAILS_PADDING + NAIL_SIZE / 2;
    const yBottom = y + h - NAILS_PADDING - NAIL_SIZE / 2;

    const top_left = { x: xLeft, y: yTop };
    const top_right = { x: xRight, y: yTop };
    const bottom_left = { x: xLeft, y: yBottom };
    const bottom_right = { x: xRight, y: yBottom };

    const corners = [top_left, top_right, bottom_left, bottom_right];

    if (this.type === "hidden") {
      push();
      stroke("#f4f4f4");
      noStroke();
      noFill();
      rect(x, y, w, h, borderRadius);
      pop();
    }

    if (this.type === "biggest") {
      push();
      noStroke();
      fill(c);
      rect(x, y, w, h, borderRadius);

      const r = Math.min(w, h);
      noFill();
      stroke("#f4f4f4");
      strokeWeight(3);

      const cx = x + w / 2;
      const cy = y + h / 2;

      const [minR, maxR] = [
        r * PULLEY_FACTOR,
        r * PULLEY_FACTOR + PULLEY_WIDTH,
      ];
      circle(cx, cy, minR);
      circle(cx, cy, maxR);

      const ccx =
        cx + (minR / 2 + PULLEY_WIDTH / 4) * cos((knobValues["3"] / 127) * TAU);
      const ccy =
        cy + (minR / 2 + PULLEY_WIDTH / 4) * sin((knobValues["3"] / 127) * TAU);

      this.pulley.ccx = ccx;
      this.pulley.ccy = ccy;

      fill("#f4f4f4");
      circle(ccx, ccy, NAIL_SIZE);

      pop();
    }

    if (this.type === "nails") {
      push();
      strokeWeight(2);
      strokeCap(ROUND);
      corners.forEach(({ x: cx, y: cy }) => {
        noStroke();
        fill(c);
        circle(cx, cy, NAIL_SIZE);

        stroke(backgroundColor);
        line(cx - NAIL_SIZE / 4, cy, cx + NAIL_SIZE / 4, cy);
        line(cx, cy - NAIL_SIZE / 4, cx, cy + NAIL_SIZE / 4);
      });
      pop();
    }

    if (this.type === "cables") {
      push();
      noStroke();
      fill(c);
      rect(x, y, w, h, borderRadius);
      pop();

      push();
      stroke("#f4f4f4");
      strokeWeight(2);
      noFill();

      const x0 = w / 2;
      const y0 = h / 2;

      if (this.id.includes("meta")) {
        CABLES_DELTAS.forEach((delta) => {
          const dot_y = y0 + y + delta;
          const minX = x - CABLE_LENGTH - padding;
          const maxX = x + CABLE_LENGTH;
          circle(minX, dot_y, CABLE_PLUG_SIZE);
          circle(maxX, dot_y, CABLE_PLUG_SIZE);
          line(minX, dot_y, maxX, dot_y);
        });
      } else {
        CABLES_DELTAS.forEach((delta) => {
          const dot_x = x0 + x + delta;
          const minY = y - CABLE_LENGTH - padding;
          const maxY = y + CABLE_LENGTH;
          circle(dot_x, minY, CABLE_PLUG_SIZE);
          circle(dot_x, maxY, CABLE_PLUG_SIZE);
          line(dot_x, minY, dot_x, maxY);
        });
      }

      /*
      if (this.id.includes("meta")) {
        ;[-CABLES_PADDING, 0, CABLES_PADDING].forEach((delta) => {
          const dot_y = y0 + y + delta;
          const minX = x - prevBlock.props.w / 2 - padding // x - CABLE_LENGTH - padding;
          const maxX = x + x0// x + CABLE_LENGTH;
          circle(minX, dot_y, CABLE_PLUG_SIZE);
          circle(maxX, dot_y, CABLE_PLUG_SIZE);
          line(minX, dot_y, maxX, dot_y);
        });
      } else {
        ;[-CABLES_PADDING, 0, CABLES_PADDING].forEach((delta) => {
          const dot_x = x0 + x + delta;
          const minY = y - prevBlock.props.h / 2 - padding // y - CABLE_LENGTH - padding;
          const maxY = y + y0 // y + CABLE_LENGTH;
          circle(dot_x, minY, CABLE_PLUG_SIZE);
          circle(dot_x, maxY, CABLE_PLUG_SIZE);
          line(dot_x, minY, dot_x, maxY);
        });
      }
      */
      pop();
    }

    if (this.type === "icon") {
      push();
      noStroke();
      fill(c);
      rect(x, y, w, h, borderRadius);
      const r = Math.min(w, h) * 0.8;
      image(
        images[randomIcon][getIconColor(c)],
        x + w / 2 - r / 2,
        y + h / 2 - r / 2,
        r,
        r
      );
      pop();
    }

    if (
      this.type == "initial" ||
      this.type == "cables_prev" ||
      this.type === "animated"
    ) {
      push();
      noStroke();
      fill(c);
      rect(x, y, w, h, borderRadius);
      if (this.type === "animated") {
        fill("#f4f4f4");
        circle(x + w / 2, y + h / 2, NAIL_SIZE);
      }
      pop();
    }

    if (this.type === "label") {
      push();
      noStroke();
      fill(c);
      rect(x, y, w, h, borderRadius);
      fill(backgroundColor);
      textSize(14);
      textAlign(LEFT, TOP);
      textFont(overPassMono);
      text("Machine", x + 2 * padding, y + 2 * padding);
      text(`#${machineNumber}`, x + 2 * padding, y + 2 * padding + 14);
      pop();
    }

    if (this.type === "pulley_end") {
      push();
      noStroke();
      fill(c);
      rect(x, y, w, h, borderRadius);
      fill("#f4f4f4");
      circle(x + w / 2, y + h / 2, NAIL_SIZE);
      pop();
    }
  }
}

/* asdfasdf */
let midiAccess = null;
let midiConnected = false;

function initMIDI() {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(
      (access) => {
        midiAccess = access;
        midiConnected = true;
        bindMIDIInputs();
        access.onstatechange = () => bindMIDIInputs();
        updateMIDIStatus("connected");
      },
      () => updateMIDIStatus("denied")
    );
  } else {
    updateMIDIStatus("unsupported");
  }
}

function bindMIDIInputs() {
  for (const input of midiAccess.inputs.values()) {
    input.onmidimessage = onMIDIMessage;
  }
}

function onMIDIMessage(event) {
  const [status, cc, value] = event.data;
  const isCC = (status & 0xf0) === 0xb0;
  
  if (cc == "40") {
    console.log("new")
    newFactory()
  }
  
  if (!isCC) return;

  knobValues[cc] = value;
  updateKnobPanel();

  const paramName = MIDI_CC_MAP[cc];
  if (!paramName) return;
}

function applyMIDI(paramName, value, cc) {}

// ─── PANEL UI ────────────────────────────────────────────────────────────────
function buildPanel() {
  const panel = document.createElement("div");
  panel.id = "midi-panel";
  panel.style.cssText = `
    position: fixed; top: 16px; right: 16px; z-index: 9999;
    background: rgba(19,19,19,0.92); color: #fdd7d6;
    border-radius: 10px; padding: 14px 16px; width: 260px;
    font-family: monospace; font-size: 12px;
    backdrop-filter: blur(6px);
opacity: 0;
  `;

  const title = document.createElement("div");
  title.style.cssText =
    "font-size:13px; font-weight:bold; margin-bottom:10px; color:#5e5efc; letter-spacing:1px;";
  title.textContent = "AKAI MPK MINI";
  panel.appendChild(title);

  const statusEl = document.createElement("div");
  statusEl.id = "midi-status";
  statusEl.style.cssText = "font-size:11px; margin-bottom:10px; color:#888;";
  statusEl.textContent = "Waiting for MIDI…";
  panel.appendChild(statusEl);

  const knobsGrid = document.createElement("div");
  knobsGrid.id = "knob-grid";
  knobsGrid.style.cssText =
    "display:grid; grid-template-columns:1fr 1fr; gap:8px;";

  const knobDefs = [
    { cc: 1, label: "K1 seed" },
    { cc: 2, label: "K2 palette" },
    { cc: 3, label: "K3 padding" },
    { cc: 4, label: "K4 radius" },
    { cc: 5, label: "K5 speed" },
    { cc: 6, label: "K6 icon" },
    { cc: 7, label: "K7 density" },
    { cc: 8, label: "K8 steps" },
  ];

  knobDefs.forEach(({ cc, label }) => {
    const cell = document.createElement("div");
    cell.style.cssText =
      "background:rgba(255,255,255,0.05); border-radius:6px; padding:6px 8px;";

    const lbl = document.createElement("div");
    lbl.style.cssText = "color:#888; font-size:10px; margin-bottom:4px;";
    lbl.textContent = label;

    const bar = document.createElement("div");
    bar.style.cssText =
      "background:#222; border-radius:3px; height:4px; margin-bottom:4px;";

    const fill = document.createElement("div");
    fill.id = `knob-fill-${cc}`;
    fill.style.cssText = `background:#5e5efc; border-radius:3px; height:4px; width:${Math.round(
      (knobValues[cc] / 127) * 100
    )}%;`;
    bar.appendChild(fill);

    const val = document.createElement("div");
    val.id = `knob-val-${cc}`;
    val.style.cssText = "color:#fdd7d6; font-size:11px;";
    val.textContent = knobValues[cc];

    // Manual slider fallback
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = 0;
    slider.max = 127;
    slider.value = knobValues[cc];
    slider.style.cssText = "width:100%; margin-top:4px; accent-color:#5e5efc;";
    slider.addEventListener("input", (e) => {
      const v = parseInt(e.target.value);
      knobValues[cc] = v;
      const paramName = MIDI_CC_MAP[cc];
      applyMIDI(paramName, v, cc);
      updateKnobPanel();
    });

    cell.appendChild(lbl);
    cell.appendChild(bar);
    cell.appendChild(val);
    cell.appendChild(slider);
    knobsGrid.appendChild(cell);
  });

  panel.appendChild(knobsGrid);

  const hint = document.createElement("div");
  hint.style.cssText =
    "margin-top:10px; color:#555; font-size:10px; line-height:1.4;";
  hint.textContent =
    "Turn knobs on your AKAI MPK Mini, or drag sliders above. Click canvas to reseed.";
  panel.appendChild(hint);

  document.body.appendChild(panel);
}

function updateMIDIStatus(state) {
  const el = document.getElementById("midi-status");
  if (!el) return;
  const states = {
    connected: ["● MIDI connected", "#5e5efc"],
    denied: ["✕ MIDI access denied", "#e24b4a"],
    unsupported: ["◯ Web MIDI not supported", "#888"],
  };
  const [text, color] = states[state] || ["?", "#888"];
  el.textContent = text;
  el.style.color = color;
}

function updateKnobPanel() {
  Object.entries(knobValues).forEach(([cc, val]) => {
    const fill = document.getElementById(`knob-fill-${cc}`);
    const valEl = document.getElementById(`knob-val-${cc}`);
    const pct = Math.round((val / 127) * 100);
    if (fill) fill.style.width = pct + "%";
    if (valEl) valEl.textContent = val;
    // sync slider
    const slider = fill?.parentElement?.parentElement?.querySelector(
      "input[type=range]"
    );
    if (slider) slider.value = val;
  });
}
