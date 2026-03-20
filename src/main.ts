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

  const factoryGrid: GridItem[][] = [];

  function createFactory(): Factory {
    return [];
  }

  function createFactories(horizontal: number = 2, vertical: number = 2) {
    const grid: GridItem[][] = [];
    for (let i = 0; i < horizontal; i++) {
      grid[i] = [];
      for (let j = 0; j < vertical; j++) {
        const width = config.grid.width / horizontal;
        const height = config.grid.height / vertical;
        const dx = i * width + (i - 1) * config.padding;
        const dy = j * height + (j - 1) * config.padding;
        let mainFactory = createFactory();
        let metaFactory = createFactory();
        grid[i][j] = {
          mainFactory,
          metaFactory,
          dx,
          dy,
          x: config.margin.x + dx,
          y: config.margin.y + dy,
        };
      }
    }
    return grid;
  }

  p.preload = () => {
    loadAssets();
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    
  };

  p.mouseClicked = () => {

  }

  p.draw = () => {
    p.background(palette[params.backgroundColor]);
    p.push();
    p.translate(
      (config.grid.width - config.space.width) / 2,
      (config.grid.height - config.space.height) / 2,
    );

    factoryGrid.flat().forEach((item) => {
      const { dx, dy, x, y } = item;
      const { mainFactory, metaFactory } = item;
      p.push();
      p.translate(config.margin.x + dx, config.margin.y + dy);
      mainFactory.flat().forEach((block) => block.draw(p, params, factoryGrid));
      p.translate(x, y);
      metaFactory.flat().forEach((block) => block.draw(p, params, factoryGrid));
      p.pop();
    });

    // should redraw biggest blocks i

    // p.noLoop();
  };
};

new p5(sketch);
