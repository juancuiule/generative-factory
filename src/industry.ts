import { Block } from "./block";
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

  const outerDimension = axis === "rows" ? "height" : "width";
  const innerDimension = axis === "rows" ? "width" : "height";

  for (let outer = 0; outer < outerCount; outer++) {
    const innerCount = defs[outer].length;
    grid[outer] = [];

    // Resolve which dimension belongs to outer vs inner based on axis
    const outerSize =
      (config.grid[outerDimension] - (outerCount - 1) * config.padding) /
      outerCount;

    const innerSize =
      (config.grid[innerDimension] - (innerCount - 1) * config.padding) /
      innerCount;

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

      let metaFactory: Factory = [];

      // pick biggest block to make a meta factory inside
      const biggest = Block.getBiggest(mainFactory.flat());
      if (
        biggest.props.w > 24 * 4 + config.padding * 3 &&
        biggest.props.h > 24 * 4 + config.padding * 3
      ) {
        const {
          props: { x, y, w: nw, h: nh, id },
        } = biggest;
        biggest.setType("meta");
        metaFactory = createFactory(
          {
            width: nw,
            height: nh,
            steps: 4,
            subSteps: 4,
            direction: "vertical",
            factoryName: `metaFactory-${outer}-${inner}`,
            padding: config.padding,
            factoryType: "meta",
          },
          randomFn,
        );

        grid[outer][inner] = {
          mainFactory,
          metaFactory,
          dx,
          dy,
          x, // : config.margin.x + dx,
          y, // : config.margin.y + dy,
        };
      } else {
        grid[outer][inner] = {
          mainFactory,
          metaFactory,
          dx,
          dy,
          x: config.margin.x + dx,
          y: config.margin.y + dy,
        };
      }
    }
  }

  return grid;
}
