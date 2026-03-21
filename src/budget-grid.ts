import { RandomFn } from "./types";

type Position = { x: number; y: number };

type GridFunctions = {
  total: number;
  secondaryTotal: number;
  stepPositionUpdate: (position: Position, v: number) => Position;
  subStepPositionUpdate: (position: Position, v: number) => Position;
  getSizeX: (main: number, secondary: number) => number;
  getSizeY: (main: number, secondary: number) => number;
};

function getGridFunctions(
  direction: "horizontal" | "vertical",
  width: number,
  height: number,
): GridFunctions {
  if (direction === "horizontal") {
    return {
      total: width,
      secondaryTotal: height,
      stepPositionUpdate: ({ x }, v) => ({ x: x + v, y: 0 }),
      subStepPositionUpdate: ({ x, y }, v) => ({ x, y: y + v }),
      getSizeX: (main, _) => main,
      getSizeY: (_, secondary) => secondary,
    };
  } else {
    return {
      total: height,
      secondaryTotal: width,
      stepPositionUpdate: ({ y }, v) => ({ x: 0, y: y + v }),
      subStepPositionUpdate: ({ x, y }, v) => ({ x: x + v, y }),
      getSizeX: (_, secondary) => secondary,
      getSizeY: (main, _) => main,
    };
  }
}

type Cell = { x: number; y: number; width: number; height: number };

type Direction = "horizontal" | "vertical";

type Props = {
  direction: Direction;
  size: { width: number; height: number };
  steps: number;
  subSteps: number;
  padding: number;
  minBlockSize?: number;
};

export function createGrid(props: Props, randomFn: RandomFn) {
  const { direction, size, minBlockSize = 24 } = props;
  const { steps, subSteps, padding } = props;

  const grid: Cell[][] = [];

  let position: Position = { x: 0, y: 0 };

  const {
    total,
    secondaryTotal,
    subStepPositionUpdate,
    stepPositionUpdate,
    getSizeX,
    getSizeY,
  } = getGridFunctions(direction, size.width, size.height);

  let mainBudget = total - padding * (steps - 1);

  for (let i = 0; i < steps; i++) {
    grid[i] = [];
    const stepsLeft = steps - i;

    const mainSize =
      stepsLeft === 1
        ? mainBudget
        : randomFn(
            minBlockSize,
            Math.max(mainBudget - minBlockSize * (stepsLeft - 1), minBlockSize),
          );

    let secondaryBudget = secondaryTotal - padding * (subSteps - 1);

    for (let j = 0; j < subSteps; j++) {
      const subStepsLeft = subSteps - j;
      const secondarySize =
        subStepsLeft === 1
          ? secondaryBudget
          : randomFn(
              minBlockSize,
              Math.max(
                secondaryBudget - minBlockSize * (subStepsLeft - 1),
                minBlockSize,
              ),
            );

      grid[i][j] = {
        x: position.x,
        y: position.y,
        width: getSizeX(mainSize, secondarySize),
        height: getSizeY(mainSize, secondarySize),
      };

      position = subStepPositionUpdate(position, secondarySize + padding);
      secondaryBudget -= secondarySize;
    }

    position = stepPositionUpdate(position, mainSize + padding);
    mainBudget -= mainSize;
  }

  return grid;
}
