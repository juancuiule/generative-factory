import { Font, Image } from "p5";
import { Block } from "./block";

const WIDTH = 450;
const HEIGHT = 450;

// replace with p5
export const config = {
  space: { width: WIDTH, height: HEIGHT },
  grid: { width: WIDTH * 1, height: HEIGHT * 1 },
  margin: { x: WIDTH * 0, y: HEIGHT * 0 },
  textSize: 14,
  padding: 4,
  borderRadius: 4,
};

export const colors = ["pink", "black", "blue", "white"] as const;
export const icons = ["tension", "warning", "text"] as const;

export type Color = (typeof colors)[number];
export type Icon = (typeof icons)[number];

export const palette: Record<Color, string> = {
  pink: "#fdd7d6",
  black: "#131313",
  blue: "#5e5efc",
  white: "#f4f4f4",
};

export const inverted: Record<Color, Color> = {
  pink: "blue",
  black: "white",
  blue: "black",
  white: "blue",
};

export type Assets = {
  images: Record<Icon, Record<Color, Image | undefined>>;
  font: Font | undefined;
};

export const params: Params = {
  backgroundColor: "pink",
  randomIcon: "tension",
  machineNumber: 128,
};

export type Params = {
  backgroundColor: Color;
  randomIcon: Icon;
  machineNumber: number;
};

export const assets: Assets = {
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

export const factoryConfig = {
  nails: { padding: 4, size: 10, quantity: 0 },
  cables: {
    padding: 20,
    deltas: [-20, 0, 20],
    length: 12,
    plugSize: 10,
    quantity: 0,
  },
  animatedBlocks: { quantity: 3 },
  pulleyCables: { quantity: 1, factor: 1.1, width: 20, speed: 0 },
};

export type GridItem = {
  mainFactory: Factory;
  metaFactory: Factory;
  dx: number;
  dy: number;
  x: number;
  y: number;
};

export type Factory = Block[][];
