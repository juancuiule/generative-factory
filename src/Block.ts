import p5 from "p5";
import {
  assets,
  Color,
  config,
  factoryConfig,
  GridItem,
  inverted,
  palette,
  Params,
} from "./config";

type BlockType =
  | "initial"
  | "hidden"
  | "animated-prev"
  | "animated-next"
  | "meta"
  | "biggest"
  | "screws"
  | "cables"
  | "icon"
  | "cables-prev"
  | "pulley-end"
  | "label";

type BlockProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: Color;
  id: string;
};

function mulberry32(a: number) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Block {
  private seed = (() => {
    const gen = mulberry32(100);
    return Math.floor(gen() * 100);
  })();
  public id: string;
  public props: BlockProps;
  private initialProps: BlockProps;
  public type: BlockType = "initial";
  private pulley: { ccx: number; ccy: number } = { ccx: 0, ccy: 0 };

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    id: string,
    // color: Color,
  ) {
    this.id = id;
    this.props = { x, y, w: width, h: height, id, color: "black" };
    this.initialProps = { ...this.props };
  }

  setColor(color: Color) {
    this.props.color = color;
    return this;
  }

  setType(type: BlockType) {
    this.type = type;
    return this;
  }

  getCoords() {
    const [name, ...cords] = this.id.split("-");
    // factory x, factory y, block i, block j
    const [fx, fy, bi, bj] = cords.map((x) => Number(x));
    return { name, fx, fy, bi, bj };
  }

  getSize() {
    return this.props.w * this.props.h;
  }

  getNailsCorners() {
    const { x, y, w, h } = this.props;
    const SCREWS_PADDING = factoryConfig.screws.padding;
    const SCREWS_SIZE = factoryConfig.screws.size;

    const xLeft = x + SCREWS_PADDING + SCREWS_SIZE / 2;
    const xRight = x + w - SCREWS_PADDING - SCREWS_SIZE / 2;
    const yTop = y + SCREWS_PADDING + SCREWS_SIZE / 2;
    const yBottom = y + h - SCREWS_PADDING - SCREWS_SIZE / 2;

    const top_left = { x: xLeft, y: yTop };
    const top_right = { x: xRight, y: yTop };
    const bottom_left = { x: xLeft, y: yBottom };
    const bottom_right = { x: xRight, y: yBottom };

    return [top_left, top_right, bottom_left, bottom_right];
  }

  draw(
    p: p5,
    { colors: { background }, randomIcon, machineNumber }: Params,
    factoryGrid: GridItem[][],
  ) {
    const { x, y, w, h, color } = this.props;
    const previous = getPrevBlock(this, factoryGrid);
    const next = getNextBlock(this, factoryGrid);

    const { size: SCREWS_SIZE } = factoryConfig.screws;

    p.push();
    switch (this.type) {
      case "hidden": {
        // p.noStroke();
        // p.noFill();
        // p.rect(x, y, w, h);
        break;
      }
      case "biggest": {
        p.noStroke();
        p.fill(palette[color]);
        p.rect(x, y, w, h, config.borderRadius);

        const r = Math.min(w, h);
        p.noFill();
        p.stroke(palette.white);
        p.strokeWeight(3);

        const { factor: PULLEY_FACTOR, width: PULLEY_WIDTH } =
          factoryConfig.pulleyCables;

        const cx = x + w / 2;
        const cy = y + h / 2;
        const minR = r * PULLEY_FACTOR;
        const maxR = minR + PULLEY_WIDTH;
        p.circle(cx, cy, minR);
        p.circle(cx, cy, maxR);

        const ccx =
          cx +
          (minR / 2 + PULLEY_WIDTH / 4) *
            p.cos((p.frameCount * this.seed) / 1000);
        const ccy =
          cy +
          (minR / 2 + PULLEY_WIDTH / 4) *
            p.sin((p.frameCount * this.seed) / 1000);

        this.pulley.ccx = ccx;
        this.pulley.ccy = ccy;

        p.fill(palette.white);
        p.circle(ccx, ccy, factoryConfig.screws.size);

        const ends = getPulleyEndCoords(factoryGrid, this);
        ends.forEach((end) => {
          p.line(ccx, ccy, end.x, end.y);
        });
        break;
      }
      case "screws": {
        p.strokeWeight(2);
        p.strokeCap(p.ROUND);

        this.getNailsCorners().forEach(({ x: cx, y: cy }) => {
          p.noStroke();
          p.fill(palette[color]);
          p.circle(cx, cy, factoryConfig.screws.size);

          p.stroke(background);
          p.line(cx - SCREWS_SIZE / 4, cy, cx + SCREWS_SIZE / 4, cy);
          p.line(cx, cy - SCREWS_SIZE / 4, cx, cy + SCREWS_SIZE / 4);
        });
        break;
      }
      case "icon": {
        p.noStroke();
        p.fill(palette[color]);
        p.rect(x, y, w, h, config.borderRadius);

        const r = Math.min(w, h) * 0.8;
        const asset = assets.images[randomIcon][inverted[color]];
        if (asset) {
          p.image(asset, x + w / 2 - r / 2, y + h / 2 - r / 2, r, r);
        }
        break;
      }
      case "label": {
        p.noStroke();
        p.fill(palette[color]);
        p.rect(x, y, w, h, config.borderRadius);
        p.fill(palette[background]);
        p.textSize(config.textSize);
        p.textAlign(p.LEFT, p.TOP);
        if (assets.font) {
          p.textFont(assets.font);
        }
        p.text("Machine", x + 2 * config.padding, y + 2 * config.padding);
        p.text(
          `#${machineNumber}`,
          x + 2 * config.padding,
          y + 2 * config.padding + config.textSize,
        );
        break;
      }
      case "pulley-end": {
        p.noStroke();
        p.fill(palette[color]);
        p.rect(x, y, w, h, config.borderRadius);

        p.fill(palette.white);
        p.circle(x + w / 2, y + h / 2, SCREWS_SIZE);
        break;
      }
      case "cables": {
        p.noStroke();
        p.fill(palette[color]);
        p.rect(x, y, w, h, config.borderRadius);

        p.stroke(palette[background]);
        p.strokeWeight(2);
        p.noFill();

        const x0 = w / 2;
        const y0 = h / 2;

        const { cables } = factoryConfig;

        if (this.id.includes("meta")) {
          cables.deltas.forEach((delta) => {
            const dot_y = y0 + y + delta;
            const minX = x - cables.length - config.padding;
            const maxX = x + cables.length;
            p.circle(minX, dot_y, cables.plugSize);
            p.circle(maxX, dot_y, cables.plugSize);
            p.line(minX, dot_y, maxX, dot_y);
          });
        } else {
          cables.deltas.forEach((delta) => {
            const dot_x = x0 + x + delta;
            const minY = y - cables.length - config.padding;
            const maxY = y + cables.length;
            p.circle(dot_x, minY, cables.plugSize);
            p.circle(dot_x, maxY, cables.plugSize);
            p.line(dot_x, minY, dot_x, maxY);
          });
        }
        break;
      }
      case "initial":
      case "cables-prev": {
        p.noStroke();
        p.fill(palette[color]);
        p.rect(x, y, w, h, config.borderRadius);
        break;
      }
    }

    if (this.type.startsWith("animated")) {
      // Strat drawing the connection to the previous/next block
      p.stroke(palette.white);
      p.strokeWeight(2);
      if (this.type === "animated-prev" && previous) {
        // If meta animates horizontally
        if (this.id.includes("meta")) {
          const space = previous.props.w + config.padding;
          const dx = p.map(
            p.cos((p.frameCount * this.seed) / 1000),
            -1,
            1,
            -space,
            0,
          );
          this.props.x = this.initialProps.x + dx;
          p.line(
            this.props.x + w / 2,
            this.props.y + h / 2,
            this.initialProps.x + w - config.padding,
            this.props.y + h / 2,
          );
        } else {
          const space = previous.props.h + config.padding;
          const dy = p.map(
            p.cos((p.frameCount * this.seed) / 1000),
            -1,
            1,
            -space,
            0,
          );
          this.props.y = this.initialProps.y + dy;
          p.line(
            this.props.x + w / 2,
            this.props.y + h / 2,
            this.props.x + w / 2,
            this.initialProps.y - space + config.padding,
          );
        }
      }
      if (this.type === "animated-next" && next) {
        // If meta animates horizontally
        if (this.id.includes("meta")) {
          const space = next.props.w + config.padding;
          const dx = p.map(
            p.cos((p.frameCount * this.seed) / 1000),
            -1,
            1,
            0,
            space,
          );
          this.props.x = this.initialProps.x + dx;
          p.line(
            this.props.x + w / 2,
            this.props.y + h / 2,
            this.initialProps.x + config.padding,
            this.props.y + h / 2,
          );
        } else {
          const space = next.props.h + config.padding;
          const dy = p.map(
            p.cos((p.frameCount * this.seed) / 1000),
            -1,
            1,
            0,
            space,
          );
          this.props.y = this.initialProps.y + dy;
          p.line(
            this.props.x + w / 2,
            this.props.y + h / 2,
            this.props.x + w / 2,
            this.initialProps.y + config.padding,
          );
        }
      }

      p.noStroke();
      p.fill(palette[color]);
      p.rect(x, y, w, h, config.borderRadius);
      p.fill(palette.white);
      p.circle(x + w / 2, y + h / 2, factoryConfig.screws.size);
    }

    p.pop();
  }

  static getBiggest(blocks: Block[]) {
    return blocks.reduce((biggest, block) =>
      block.getSize() > biggest.getSize() ? block : biggest,
    );
  }

  static getSquarer(blocks: Block[]): Block | undefined {
    return blocks.reduce((prev, curr) => {
      return Math.abs(1 - prev.props.w / prev.props.h) <
        Math.abs(1 - curr.props.w / curr.props.h)
        ? prev
        : curr;
    });
  }
}

export function getPrevBlock(
  block: Block,
  factoryGrid: GridItem[][],
): Block | undefined {
  const { name, fx, fy, bi, bj } = block.getCoords();

  if (bj > 0) {
    const item = factoryGrid[fx][fy];
    const key = name.includes("meta") ? "metaFactory" : "mainFactory";
    return item[key][bi][bj - 1];
  }
  return undefined;
}

export function getNextBlock(
  block: Block,
  factoryGrid: GridItem[][],
): Block | undefined {
  const { name, fx, fy, bi, bj } = block.getCoords();
  const item = factoryGrid[fx][fy];
  const key = name.includes("meta") ? "metaFactory" : "mainFactory";
  if (bj < item[key][bi].length - 1) {
    return item[key][bi][bj + 1];
  }
  return undefined;
}

export function getBlockBase(block: Block, factoryGrid: GridItem[][]) {
  const coords = { x: 0, y: 0 };
  factoryGrid.flat().forEach((item) => {
    const { dx, dy, x, y, mainFactory, metaFactory } = item;
    const mainBlock = mainFactory.flat().find((b) => b.id === block.id);
    const metaBlock = metaFactory.flat().find((b) => b.id === block.id);
    if (mainBlock) {
      coords.x = dx;
      coords.y = dy;
    }
    if (metaBlock) {
      coords.x = dx + x
      coords.y = dy + y
    }
  });
  return coords;
}

export function findByType(
  type: BlockType,
  factoryGrid: GridItem[][],
): Block[] {
  return factoryGrid
    .flat()
    .flatMap((item) => [...item.mainFactory.flat(), ...item.metaFactory.flat()])
    .filter((block) => block.type === type);
}

export function getPulleyEndCoords(factoryGrid: GridItem[][], biggest: Block) {
  const start = getBlockBase(biggest, factoryGrid);
  const pulleys = findByType("pulley-end", factoryGrid);
  return pulleys.map((pulley) => {
    const end = getBlockBase(pulley, factoryGrid);
    return {
      x: -start.x + end.x + pulley.props.x + pulley.props.w / 2,
      y: -start.y + end.y + pulley.props.y + pulley.props.h / 2,
    };
  });
}
