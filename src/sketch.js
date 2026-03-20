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
              Math.max(mainBudget - minBlockSize * (steps - i), minBlockSize),
            ),
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
                  minBlockSize,
                ),
              ),
            );

      const bloque = new Block(
        position.x,
        position.y,
        getSizeX(mainSize, secondarySize),
        getSizeY(mainSize, secondarySize),
        `${factoryName}-${i}-${j}`,
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

let factoryGrid = [];

const FACTORY_HIDDEN_RATIO = 0.1;
const METAFACTORY_HIDDEN_RATIO = 0.4;


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
    everyBlock.filter((b) => b.type === "initial"),
  );
  biggestOfAll.type = "biggest";

  const nonMetaBlocks = everyBlock.filter(
    (block) => block.type !== "meta" && block.type !== "biggest",
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
    (b) => b.type === "initial" && getBlockSize(b) > 100 * 100,
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
      b.props.h > 4 * padding + 2 * 14,
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
    factory.flat().forEach((_) => _.display());
    translate(x, y);
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

class Block {
  constructor(x, y, w, h, id) {
    const c = random(palette.filter((c) => c !== backgroundColor));
    this.id = id;
    this.props = { x, y, w, h, c, id };
    this.initialProps = { x, y, w, h, c, id };
    this.type = "initial";
    this.pulley = { ccx: 0, ccy: 0 };
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
          cos(frameCount * PULLEY_SPEED),
          -1,
          1,
          -p_space,
          n_space,
        );
        this.props.x = this.initialProps.x + dx;
        stroke("#f4f4f4");
        strokeWeight(2);
        line(
          this.props.x + w / 2,
          this.props.y + h / 2,
          this.initialProps.x + w - padding,
          this.props.y + h / 2,
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
          cos(frameCount * PULLEY_SPEED),
          -1,
          1,
          -p_space,
          n_space,
        );
        this.props.y = this.initialProps.y + dy;
        stroke("#f4f4f4");
        strokeWeight(2);
        line(
          this.props.x + w / 2,
          this.props.y + h / 2,
          this.props.x + w / 2,
          this.initialProps.y - p_space + padding,
        );
      }
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
        cx + (minR / 2 + PULLEY_WIDTH / 4) * cos(frameCount * PULLEY_SPEED);
      const ccy =
        cy + (minR / 2 + PULLEY_WIDTH / 4) * sin(frameCount * PULLEY_SPEED);

      this.pulley.ccx = ccx;
      this.pulley.ccy = ccy;

      fill("#f4f4f4");
      circle(ccx, ccy, NAIL_SIZE);

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
