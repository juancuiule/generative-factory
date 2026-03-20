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
  ],
};

const sketch = (p: p5) => {
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

  let randomFnCalls = 0;

  const random: typeof p.random = (...args: Parameters<typeof p.random>) => {
    randomFnCalls++;
    return p.random(...args);
  };

  // function randomFn(min: number, max: number) {
  //   randomFnCalls++;
  //   return Math.floor(p.random(min, max));
  // }

  function recreateGrid() {
    factoryGrid = createIndustry(
      industryParams.axis,
      industryParams.defs,
      random,
    );
  }

  function randomizeColors() {
    // params.colors.background = random([...colors.filter((c) => c !== "white")]);
    // params.colors.block = random([
    //   ...colors.filter((c) => c !== params.colors.background && c !== "white"),
    // ]);
    // params.colors.biggest = random([
    //   ...colors.filter(
    //     (c) =>
    //       c !== params.colors.background &&
    //       c !== params.colors.block &&
    //       c !== "white",
    //   ),
    // ]);
    params.colors.background = "blue";
    params.colors.block = "pink";
    params.colors.biggest = "black";
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
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.randomSeed(25);
    p.frameRate(1);
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

    if (p.key === "i") {
      console.log(randomFnCalls);
    }
  };

  p.draw = () => {
    p.background(palette[params.colors.background]);
    p.push();
    p.translate(
      (p.width - config.space.width) / 2,
      (p.height - config.space.height) / 2,
    );

    factoryGrid.forEach((primaryAxis) => {
      primaryAxis.forEach((item) => {
        const { dx, dy, x, y } = item;
        const { mainFactory, metaFactory } = item;

        p.push();
        p.translate(config.margin.x + dx, config.margin.y + dy);
        const biggest = Block.getBiggest(mainFactory.flat());
        mainFactory.forEach((blocks) => {
          blocks.forEach((block) => {
            if (block.id === biggest.id) {
              block.setColor(params.colors.biggest);
            } else {
              block.setColor(params.colors.block);
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
