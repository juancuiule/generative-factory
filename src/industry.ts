import { Block } from "./Block";
import { createGrid } from "./budget-grid";
import { config, Factory, GridItem } from "./config";
import { RandomFn } from "./types";

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

function createFactory(props: FactoryProps, randomFn: RandomFn): Factory {
  const { direction, width, height } = props;
  const { steps, subSteps } = props;

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

type Def = {
  steps: number;
  subSteps: number;
  direction: "horizontal" | "vertical";
};

export function createIndustry(
  axis: "rows" | "cols",
  defs: Def[][],
  randomFn: RandomFn,
) {
  const grid: GridItem[][] = [];
  const outerCount = defs.length;

  for (let outer = 0; outer < outerCount; outer++) {
    const innerCount = defs[outer].length;
    grid[outer] = [];

    // Resolve which dimension belongs to outer vs inner based on axis
    const outerSize =
      axis === "rows"
        ? (config.grid.height - (outerCount - 1) * config.padding) / outerCount
        : (config.grid.width - (outerCount - 1) * config.padding) / outerCount;

    const innerSize =
      axis === "rows"
        ? (config.grid.width - (innerCount - 1) * config.padding) / innerCount
        : (config.grid.height - (innerCount - 1) * config.padding) / innerCount;

    const outerOffset = outer * outerSize + outer * config.padding;

    for (let inner = 0; inner < innerCount; inner++) {
      const innerOffset = inner * innerSize + inner * config.padding;

      const [width, height] =
        axis === "rows" ? [innerSize, outerSize] : [outerSize, innerSize];
      const [dx, dy] =
        axis === "rows"
          ? [innerOffset, outerOffset]
          : [outerOffset, innerOffset];

      const mainFactory = createFactory(
        {
          width,
          height,
          steps: defs[outer][inner].steps,
          subSteps: defs[outer][inner].subSteps,
          direction: defs[outer][inner].direction,
          factoryName: `main-${outer}-${inner}`,
          padding: config.padding,
          factoryType: "main",
        },
        randomFn,
      );

      grid[outer][inner] = {
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
