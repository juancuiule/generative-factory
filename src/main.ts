import p5 from "p5";
import {
  Factory,
  GridItem,
  assets,
  colors,
  config,
  icons,
  palette,
  params,
} from "./config";
import { Block } from "./Block";
import { createGrid } from "./budget-grid";

type FactoryProps = {
  width: number;
  height: number;
  steps: number;
  subSteps: number;
  direction: "horizontal" | "vertical";
  factoryName: string;
  padding: number;
  factoryType: "main" | "meta";
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

  function createFactory(props: FactoryProps): Factory {
    const { direction, width, height } = props;
    const { steps, subSteps } = props;
    const randomFn = (min: number, max: number) =>
      Math.floor(p.random(min, max));
    const grid = createGrid(
      {
        size: { width, height },
        steps,
        subSteps,
        direction,
        padding: 4,
      },
      randomFn,
    );

    return grid.map((row, i) =>
      row.map((cell, j) => {
        const { x, y, width, height } = cell;
        return new Block(x, y, width, height, `${props.factoryName}-${i}-${j}`);
      }),
    );
  }

  function createFactories(horizontal: number = 2, vertical: number = 2) {
    const grid: GridItem[][] = [];
    for (let j = 0; j < vertical; j++) {
      grid[j] = [];
      for (let i = 0; i < horizontal; i++) {
        const width =
          (config.grid.width - (horizontal - 1) * config.padding) / horizontal;
        const height =
          (config.grid.height - (vertical - 1) * config.padding) / vertical;
        const dx = i * width + i * config.padding;
        const dy = j * height + j * config.padding;

        let mainFactory = createFactory({
          width,
          height,
          steps: 3,
          subSteps: 3,
          direction: "horizontal",
          factoryName: `main-${j}-${i}`,
          padding: config.padding,
          factoryType: "main",
        });

        // let metaFactory = createFactory();
        grid[j][i] = {
          mainFactory,
          metaFactory: [],
          dx,
          dy,
          x: config.margin.x + dx,
          y: config.margin.y + dy,
        };
      }
    }
    return grid;
  }

  function setRandomValues() {
    params.backgroundColor = "blue"; //  p.random([...colors.filter((c) => c !== "white")]);
    params.randomIcon = p.random([...icons]);
    params.machineNumber = Math.floor(p.random(0, 256));
    factoryGrid = createFactories(3, 5);
  }

  let factoryGrid: GridItem[][] = [];

  p.preload = () => {
    loadAssets();
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    setRandomValues();
  };

  p.mouseClicked = () => {
    console.clear();
    setRandomValues();
    p.loop();
    p.noLoop();
  };

  p.draw = () => {
    p.background(palette[params.backgroundColor]);
    p.push();
    p.translate(
      (p.width - config.space.width) / 2,
      (p.height - config.space.height) / 2,
    );

    factoryGrid.forEach((row) => {
      row.forEach((item) => {
        const { dx, dy, x, y } = item;
        const { mainFactory, metaFactory } = item;

        p.push();
        p.translate(config.margin.x + dx, config.margin.y + dy);
        p.rect(
          0,
          0,
          config.space.width / row.length - config.padding,
          config.space.height / factoryGrid.length - config.padding,
        );
        mainFactory.forEach((blocks, i) => {
          blocks.forEach((block) => {
            block.setColor("pink");
            block.draw(p, params, factoryGrid);
          });
        });
        // mainFactory.flat().forEach((block) => block.draw(p, params, factoryGrid));
        // p.translate(x, y);
        // metaFactory.flat().forEach((block) => block.draw(p, params, factoryGrid));
        p.pop();
      });
    });

    // should redraw biggest blocks i

    p.noLoop();
  };
};

new p5(sketch);
