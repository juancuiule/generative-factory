import GUI from "lil-gui";
import p5 from "p5";
import {
  GridItem,
  assets,
  colors,
  config,
  icons,
  palette,
  params,
} from "./config";
import { createIndustry } from "./industry";
import { Block } from "./Block";
import { getKeys } from "./utils";

type IndustryParams = {
  axis: "rows" | "cols";
  defs: {
    steps: number;
    subSteps: number;
    direction: "horizontal" | "vertical";
  }[][];
};

const industryParams: IndustryParams = {
  axis: "rows" as "rows" | "cols",
  defs: [
    [
      { steps: 4, subSteps: 4, direction: "horizontal" },
      { steps: 4, subSteps: 4, direction: "horizontal" },
      { steps: 4, subSteps: 4, direction: "horizontal" },
      { steps: 4, subSteps: 4, direction: "horizontal" },
    ],
    [
      { steps: 4, subSteps: 4, direction: "horizontal" },
      { steps: 4, subSteps: 4, direction: "horizontal" },
      { steps: 4, subSteps: 4, direction: "horizontal" },
      { steps: 4, subSteps: 4, direction: "horizontal" },
    ],
    // [
    //   { steps: 4, subSteps: 4, direction: "horizontal" },
    //   { steps: 4, subSteps: 4, direction: "horizontal" },
    //   { steps: 4, subSteps: 4, direction: "horizontal" },
    //   { steps: 4, subSteps: 4, direction: "horizontal" },
    // ],
    // [
    //   { steps: 4, subSteps: 4, direction: "horizontal" },
    //   { steps: 4, subSteps: 4, direction: "horizontal" },
    //   { steps: 4, subSteps: 4, direction: "horizontal" },
    //   { steps: 4, subSteps: 4, direction: "horizontal" },
    // ],
  ],
};

const _initial = industryParams;
const sketch = (p: p5) => {
  function mulberry32(a: number) {
    return function () {
      var t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function loadAssets() {
    icons.forEach((icon) => {
      colors.forEach((color) => {
        assets.images[icon][color] = p.loadImage(
          `/assets/images/${icon}-${color}.png`,
        );
      });
    });
    assets.font = p.loadFont("/assets/fonts/OverpassMono.ttf");
  }

  let midiAccess: MIDIAccess | null = null;
  let midiConnected = false;
  function updateMIDIStatus(status: "connected" | "denied" | "unsupported") {
    console.log(`MIDI status: ${status}`);
  }

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
        () => updateMIDIStatus("denied"),
      );
    } else {
      updateMIDIStatus("unsupported");
    }
  }

  let highlight = 0;

  function onMIDIMessage(message: MIDIMessageEvent) {
    if (!message.data) return;
    const [status, cc, value] = message.data;
    console.log(
      `MIDI message received: status=${status}, cc=${cc}, value=${value}`,
    );

    highlight = {
      40: 0,
      41: 1,
      42: 2,
      43: 3,
      36: 4,
      37: 5,
      38: 6,
      39: 7,

      48: 8,
      49: 9,
      50: 10,
      51: 11,
      44: 12,
      45: 13,
      46: 14,
      47: 15,
    }[cc]
  }

  function bindMIDIInputs() {
    if (!midiAccess) return;
    for (const input of midiAccess.inputs.values()) {
      input.onmidimessage = onMIDIMessage;
    }
  }

  const buildSeeds = () =>
    (() => {
      // p.randomSeed(10);
      return Array.from({ length: 16 }).map((_, i) => mulberry32(i));
    })();

  let seeds = buildSeeds();

  const random: (grid: number) => (min: number, max: number) => number =
    (grid: number) => (min: number, max: number) => {
      const rand = seeds[grid](); // returns a float between 0 and 1
      return min + rand * (max - min);
    };

  function recreateGrid(params: IndustryParams = industryParams) {
    seeds = buildSeeds();
    factoryGrid = createIndustry(params.axis, params.defs, random);
  }

  function randomizeColors() {
    params.colors.background = p.random([
      ...colors.filter((c) => c !== "white"),
    ]);
    params.colors.block = p.random([
      ...colors.filter((c) => c !== params.colors.background && c !== "white"),
    ]);
    params.colors.biggest = p.random([
      ...colors.filter(
        (c) =>
          c !== params.colors.background &&
          c !== params.colors.block &&
          c !== "white",
      ),
    ]);
  }

  function setRandomValues() {
    randomizeColors();
    // params.randomIcon = random([...icons]);
    // params.machineNumber = Math.floor(random(0, 256));

    recreateGrid();
  }

  let factoryGrid: GridItem[][] = [];

  const gui = new GUI();
  const paramsFolder = gui.addFolder("Params");

  p.preload = () => {
    loadAssets();

    const colorsFolder = paramsFolder.addFolder("Colors");
    getKeys(params.colors).forEach((key) => {
      colorsFolder
        .add(params.colors, key, [...colors])
        .onChange(() => p.redraw());
    });

    const gridsFolder = paramsFolder.addFolder("Grids");
    industryParams.defs.forEach((row, rowIndex) => {
      const rowFolder = gridsFolder.addFolder(`Row ${rowIndex + 1}`);
      row.forEach((cell, cellIndex) => {
        const cellFolder = rowFolder.addFolder(`Cell ${cellIndex + 1}`);
        cellFolder.add(cell, "steps", 1, 4, 1).onChange(() => {
          recreateGrid();
          p.redraw();
        });
        cellFolder.add(cell, "subSteps", 1, 4, 1).onChange(() => {
          recreateGrid();
          p.redraw();
        });
      });
    });

    paramsFolder.close();
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.randomSeed(25);
    initMIDI();
    // p.frameRate(1);
    setRandomValues();
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    p.redraw();
  };

  p.keyPressed = () => {
    if (p.key === "r") {
      console.clear();
      setRandomValues();
      gui.controllersRecursive().forEach((c) => c.updateDisplay());
      p.redraw();
    }

    if (p.key === "c") {
      randomizeColors();
      p.redraw();
    }
  };

  p.draw = () => {
    p.background(palette[params.colors.background]);
    p.push();
    p.translate(
      (p.width - config.space.width) / 2,
      (p.height - config.space.height) / 2,
    );

    factoryGrid.forEach((primaryAxis, i) => {
      primaryAxis.forEach((item, j) => {
        const { dx, dy, x, y } = item;
        const { mainFactory, metaFactory } = item;

        p.push();
        p.translate(config.margin.x + dx, config.margin.y + dy);
        const biggest = Block.getBiggest(mainFactory.flat());
        mainFactory.forEach((blocks) => {
          blocks.forEach((block) => {
            // if (block.id === biggest.id) {
            //   block.setColor(params.colors.biggest);
            // } else {
            //   block.setColor(params.colors.block);
            // }
            block.setColor(params.colors.block);
            if (i * 4 + j === highlight) {
              block.setColor(params.colors.biggest);
            }

            block.draw(p, params, factoryGrid);
          });
        });

        p.translate(x, y);
        // mainFactory.flat().forEach((block) => block.draw(p, params, factoryGrid));
        // p.translate(x, y);
        metaFactory
          .flat()
          .forEach((block) => block.draw(p, params, factoryGrid));
        p.pop();
      });
    });

    // should redraw biggest blocks i

    // p.noLoop();
  };
};

new p5(sketch);
