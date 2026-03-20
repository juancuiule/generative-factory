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

  function randomFn(min: number, max: number) {
    return Math.floor(p.random(min, max));
  }

  const axis = "rows" as "rows" | "cols";

  function setRandomValues() {
    params.backgroundColor = "blue"; //  p.random([...colors.filter((c) => c !== "white")]);
    params.randomIcon = p.random([...icons]);
    params.machineNumber = Math.floor(p.random(0, 256));

    factoryGrid = createIndustry(
      axis,
      [
        [
          { steps: 3, subSteps: 3, direction: "horizontal" },
          { steps: 2, subSteps: 2, direction: "vertical" },
        ],
        [
          // first row/col
          { steps: 3, subSteps: 3, direction: "vertical" },
          { steps: 3, subSteps: 3, direction: "horizontal" },
          { steps: 3, subSteps: 3, direction: "horizontal" },
        ], // second row/col
        // 3, 2, 4
      ],
      randomFn,
    );
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

    const availableColors = colors.filter((c) => c !== params.backgroundColor);

    factoryGrid.forEach((primaryAxis, i) => {
      primaryAxis.forEach((item, j) => {
        const { dx, dy, x, y } = item;
        const { mainFactory, metaFactory } = item;

        p.push();
        p.translate(config.margin.x + dx, config.margin.y + dy);
        // p.rect(
        //   0,
        //   0,
        //   config.space.width / (axis === "cols" ? factoryGrid[0].length : primaryAxis.length) - config.padding,
        //   config.space.height / (axis === "cols" ? primaryAxis.length : factoryGrid[0].length) - config.padding,
        // );
        mainFactory.forEach((blocks) => {
          blocks.forEach((block) => {
            block.setColor("pink") // availableColors[(i + j) % availableColors.length]);
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
