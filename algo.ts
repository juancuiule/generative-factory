import p5 from "p5";

const WIDTH = 800;
const HEIGHT = 800;

const colors = ["pink", "black", "blue", "white"] as const;
const icons = ["tension", "warning", "text"] as const;

export type Color = (typeof colors)[number];
export type Icon = (typeof icons)[number];

export const palette: Record<Color, string> = {
  pink: "#fdd7d6",
  black: "#131313",
  blue: "#5e5efc",
  white: "#f4f4f4",
};

const inverted: Record<Color, Color> = {
  pink: "blue",
  black: "white",
  blue: "black",
  white: "blue",
};

function getKeys<T extends Record<string, any>>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

type Assets = {
  images: Record<Icon, Record<Color, p5.Image | undefined>>;
  font: p5.Font | undefined;
};

type Params = {
  backgroundColor: Color;
  randomIcon: Icon;
  machineNumber: number;
};

const sketch = (p: p5) => {
  const assets: Assets = {
    images: {
      tension: {
        pink: undefined,
        black: undefined,
        blue: undefined,
        white: undefined,
      },
      warning: {
        pink: undefined,
        black: undefined,
        blue: undefined,
        white: undefined,
      },
      text: {
        pink: undefined,
        black: undefined,
        blue: undefined,
        white: undefined,
      },
    },
    font: undefined,
  };

  const config = {
    space: { width: WIDTH, height: HEIGHT },
    margin: { x: WIDTH * 0.1, y: HEIGHT * 0.1 },
    grid: { width: WIDTH * 0.8, height: HEIGHT * 0.8 },
    palete: [palette.pink, palette.black, palette.blue],
  };

  const params: Params = {
    backgroundColor: "pink",
    randomIcon: "tension",
    machineNumber: 128,
  };

  function setRandomValues() {}

  p.preload = () => {
    icons.forEach((icon) => {
      getKeys(palette).forEach((color) => {
        assets.images[icon][color] = p.loadImage(
          `./images/${icon}-${color}.png`,
        );
      });
    });
    assets.font = p.loadFont("./overpass-mono.ttf");
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.background(0);
    p.noLoop();
  };

  p.draw = () => {
    p.background(palette[params.backgroundColor]);
    p.push();

    // Move to top-left of grid
    p.translate(
      (p.width - config.space.width) / 2,
      (p.height - config.space.height) / 2,
    );
    p.circle(0, 0, 10);

    p.pop();
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

new p5(sketch);
