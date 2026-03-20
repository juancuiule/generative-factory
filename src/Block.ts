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
  | "animated"
  | "meta"
  | "biggest"
  | "nails"
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

export class Block {
  private id: string;
  private props: BlockProps;
  // private initialProps: BlockProps;
  private type: BlockType = "initial";
  // private pulley: { ccx: number; ccy: number } = { ccx: 0, ccy: 0 };

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
    // this.initialProps = { ...this.props };
  }

  setColor(color: Color) {
    this.props.color = color;
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
    const NAILS_PADDING = factoryConfig.nails.padding;
    const NAIL_SIZE = factoryConfig.nails.size;

    const xLeft = x + NAILS_PADDING + NAIL_SIZE / 2;
    const xRight = x + w - NAILS_PADDING - NAIL_SIZE / 2;
    const yTop = y + NAILS_PADDING + NAIL_SIZE / 2;
    const yBottom = y + h - NAILS_PADDING - NAIL_SIZE / 2;

    const top_left = { x: xLeft, y: yTop };
    const top_right = { x: xRight, y: yTop };
    const bottom_left = { x: xLeft, y: yBottom };
    const bottom_right = { x: xRight, y: yBottom };

    return [top_left, top_right, bottom_left, bottom_right];
  }

  draw(
    p: p5,
    { backgroundColor, randomIcon, machineNumber }: Params,
    _factoryGrid: GridItem[][],
  ) {
    const { x, y, w, h, color } = this.props;
    // const previous = getPrevBlock(this, factoryGrid);
    // const next = getNextBlock(this, factoryGrid);

    const { size: NAIL_SIZE } = factoryConfig.nails;

    p.push();
    switch (this.type) {
      case "hidden": {
        p.stroke(palette.white);
        p.noStroke();
        p.noFill();
        p.rect(x, y, w, h);
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
        break;
      }
      case "nails": {
        p.strokeWeight(2);
        p.strokeCap(p.ROUND);

        this.getNailsCorners().forEach(({ x: cx, y: cy }) => {
          p.noStroke();
          p.fill(palette[color]);
          p.circle(x, y, factoryConfig.nails.size);

          p.stroke(palette[backgroundColor]);
          p.line(cx - NAIL_SIZE / 4, cy, cx + NAIL_SIZE / 4, cy);
          p.line(cx, cy - NAIL_SIZE / 4, cx, cy + NAIL_SIZE / 4);
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
        p.fill(palette[backgroundColor]);
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
        p.circle(x + w / 2, y + h / 2, NAIL_SIZE);
        break;
      }
      case "initial":
      case "cables-prev":
      case "animated": {
        p.noStroke();
        p.fill(palette[color]);
        p.rect(x, y, w, h, config.borderRadius);
        if (this.type === "animated") {
          p.fill(palette.white);
          p.circle(x + w / 2, y + h / 2, NAIL_SIZE);
        }
        break;
      }
    }
    p.pop();
  }

  static getBiggest(blocks: Block[]) {
    return blocks.reduce((biggest, block) =>
      block.getSize() > biggest.getSize() ? block : biggest,
    );
  }
}

// function getPrevBlock(
//   block: Block,
//   factoryGrid: GridItem[][],
// ): Block | undefined {
//   const { name, fx, fy, bi, bj } = block.getCoords();
//   if (bj > 0) {
//     return undefined;
//   }
//   const item = factoryGrid[fx][fy];
//   const key = name.includes("meta") ? "metaFactory" : "mainFactory";
//   return item[key][bi][bj - 1];
// }

// function getNextBlock(
//   block: Block,
//   factoryGrid: GridItem[][],
// ): Block | undefined {
//   const { name, fx, fy, bi, bj } = block.getCoords();
//   const item = factoryGrid[fx][fy];
//   const key = name.includes("meta") ? "metaFactory" : "mainFactory";
//   if (bj < item[key][bi].length - 1) {
//     return undefined;
//   }
//   return item[key][bi][bj + 1];
// }
