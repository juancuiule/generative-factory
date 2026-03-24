import GUI from "lil-gui";
import p5 from "p5";
import {
  GridItem,
  LAYERS,
  LayerName,
  assets,
  colors,
  config,
  factoryConfig,
  icons,
  palette,
  params,
} from "./config";
import { createIndustry } from "./industry";
import { Block, getNextBlock, getPrevBlock } from "./block";
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
    ],
    [
      { steps: 4, subSteps: 4, direction: "horizontal" },
      { steps: 4, subSteps: 4, direction: "horizontal" },
    ],
  ],
};

const sketch = (p: p5) => {
  let layers: Record<LayerName, p5.Graphics> = {
    main: p.createGraphics(p.windowWidth, p.windowHeight),
    pulley: p.createGraphics(p.windowWidth, p.windowHeight),
  };

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

  const random = (min: number, max: number) => p.random(min, max);

  function recreateGrid() {
    factoryGrid = createIndustry(
      industryParams.axis,
      industryParams.defs,
      random,
    );
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
    assignColors(
      factoryGrid
        .flat(2)
        .flatMap((item) => [
          ...item.mainFactory.flat(),
          ...item.metaFactory.flat(),
        ]),
    );
  }

  function setRandomValues() {
    randomizeColors();
    params.randomIcon = p.random([...icons]);
    params.machineNumber = Math.floor(p.random(0, 256));

    recreateGrid();
    assignTypes(factoryGrid);
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

  function assignColors(blocks: Block[]) {
    blocks.forEach((block) =>
      block.setColor(
        p.random([
          ...colors.filter(
            (c) => c !== "white" && c !== params.colors.background,
          ),
        ]),
      ),
    );
  }

  function assignTypes(factoryGrid: GridItem[][]) {
    const everyBlock = factoryGrid
      .flat(2)
      .flatMap((item) => [
        ...item.mainFactory.flat(),
        ...item.metaFactory.flat(),
      ]);

    assignColors(everyBlock);

    factoryGrid.flat().forEach((item) => {
      const { mainFactory, metaFactory } = item;
      mainFactory
        .flat()
        .filter((b) => b.type !== "meta")
        .forEach((b) => {
          if (p.random() > 1 - factoryConfig.mainFactoryHiddenRatio) {
            b.setType("hidden");
          }
        });
      metaFactory.flat().forEach((b) => {
        if (p.random() > 1 - factoryConfig.metaFactoryHiddenRatio) {
          b.setType("hidden");
        }
      });
    });

    // Biggest, draw ring
    const biggestBlock = Block.getBiggest(
      everyBlock.filter((b) => b.type === "initial"),
    );
    biggestBlock.setType("biggest");

    // Screws
    const screwsBlock = everyBlock
      .filter((b) => b.type === "initial")
      .filter(canFitScrews)
      .at(0);
    if (screwsBlock) {
      screwsBlock.setType("screws");
    }

    // Cables
    const cablesBlock = everyBlock
      .filter((b) => b.type === "initial")
      .filter((block) => canFitCables(block, factoryGrid))
      .at(0);
    if (cablesBlock) {
      cablesBlock.setType("cables");
      const prev = getPrevBlock(cablesBlock, factoryGrid);
      if (prev) {
        prev.setType("cables-prev");
      }
    }

    // Icon
    const iconBlock = Block.getSquarer(
      everyBlock
        .filter((b) => b.type === "initial")
        .filter((block) => block.getSize() > 100 * 100),
    );
    if (iconBlock) {
      iconBlock.setType("icon");
    }

    // Animated
    const animatedPrevBlocks = everyBlock
      .filter((b) => b.type === "initial")
      .filter((block) => canBeAnimatedPrev(block, factoryGrid))
      .slice(0, 2);
    animatedPrevBlocks.forEach((block) => {
      block.setType("animated-prev");
    });

    const animatedNextBlocks = everyBlock
      .filter((b) => b.type === "initial")
      .filter((block) => canBeAnimatedNext(block, factoryGrid))
      .slice(0, 2);
    animatedNextBlocks.forEach((block) => {
      block.setType("animated-next");
    });

    // Label
    const labelBlock = everyBlock
      .filter((b) => b.type === "initial")
      .filter(canFitLabel)
      .at(0);
    if (labelBlock) {
      labelBlock.setType("label");
    }

    // Pulley
    const pulleyBlock = everyBlock.filter((b) => b.type === "initial").at(0);
    if (pulleyBlock) {
      pulleyBlock.setType("pulley-end");
    }
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);

    // Create all layers once
    layers = Object.fromEntries(
      LAYERS.map((name) => [name, p.createGraphics(p.width, p.height)]),
    ) as Record<LayerName, p5.Graphics>;

    p.randomSeed(25);

    // p.frameRate(1);
    setRandomValues();
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    LAYERS.forEach((name) => {
      layers[name].remove();
      layers[name] = p.createGraphics(p.width, p.height);
    });
    p.redraw();
  };

  p.keyPressed = () => {
    if (p.key === "h") {
      if (gui._hidden) {
        gui.show();
      } else {
        gui.hide();
      }
    }
    if (p.key === "f") {
      // toggle full screen
      const fs = p.fullscreen();
      p.fullscreen(!fs);
    }
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

  function forEachLayer(fn: (layer: p5.Graphics) => void) {
    LAYERS.forEach((name) => {
      fn(layers[name]);
    });
  }

  p.draw = () => {
    forEachLayer((layer) => layer.clear());

    p.background(palette[params.colors.background]);

    forEachLayer((layer) => {
      layer.push();
      layer.translate(
        (p.width - config.space.width) / 2,
        (p.height - config.space.height) / 2,
      );
    });

    factoryGrid.forEach((primaryAxis) => {
      primaryAxis.forEach((item) => {
        const { dx, dy, x, y } = item;
        const { mainFactory, metaFactory } = item;

        forEachLayer((layer) => {
          layer.push();
          layer.translate(config.margin.x + dx, config.margin.y + dy);
        });
        mainFactory.forEach((blocks) => {
          blocks.forEach((block) => {
            if (block.type !== "meta") {
              block.draw(p, params, factoryGrid, layers);
            }
          });
        });

        forEachLayer((layer) => layer.translate(x, y));
        metaFactory.flat().forEach((block) => {
          block.draw(p, params, factoryGrid, layers);
        });

        forEachLayer((layer) => layer.pop());
      });
    });

    forEachLayer((layer) => p.image(layer, 0, 0));
    p.pop();
    forEachLayer((layer) => layer.pop());
    // p.noLoop();
  };
};

function canFitCables(block: Block, factoryGrid: GridItem[][]) {
  const { plugSize, deltas, padding, length } = factoryConfig.cables;
  const target =
    (plugSize * deltas.length + padding * (deltas.length - 1)) * 1.5;
  const secondaryTarget = ((length - padding) / 2 + plugSize) * 2 + padding;

  const { w, h } = block.props;

  const prevBlock = getPrevBlock(block, factoryGrid);
  if (!prevBlock || prevBlock.type !== "initial") {
    return false;
  }

  const { w: pw, h: ph } = prevBlock.props;

  if (block.id.includes("meta")) {
    return (
      w > secondaryTarget && h > target && pw > secondaryTarget && ph > target
    );
  } else {
    return (
      h > secondaryTarget && w > target && pw > target && ph > secondaryTarget
    );
  }
}

function canFitScrews(block: Block) {
  const { w, h } = block.props;
  const { size, padding } = factoryConfig.screws;
  const target = (size * 2 + padding * 2) * 1.5;
  return w > target && h > target;
}

function canBeAnimatedPrev(block: Block, factoryGrid: GridItem[][]) {
  const prev = getPrevBlock(block, factoryGrid);
  return (
    prev && // Has previous block
    prev.type === "hidden" && // Previous block is hidden
    !getPrevBlock(prev, factoryGrid)?.type.startsWith("animated") // Previous block's previous block is not animated
  );
}

function canBeAnimatedNext(block: Block, factoryGrid: GridItem[][]) {
  const next = getNextBlock(block, factoryGrid);
  return (
    next && // Has next block
    next.type === "hidden" && // Next block is hidden
    !getNextBlock(next, factoryGrid)?.type.startsWith("animated") // Next block's next block is not animated
  );
}

function canFitLabel(block: Block) {
  const { w, h } = block.props;
  return w > 100 && h > 4 * config.padding + 2 * 14;
}

new p5(sketch);
