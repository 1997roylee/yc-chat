"use client";

import { useEffect, useRef, useState } from "react";

// ─── Spinner data (from cli-spinners) ────────────────────────────────────────

export const spinners = {
  dots: { interval: 80, frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] },
  dots2: { interval: 80, frames: ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"] },
  dots3: { interval: 80, frames: ["⠋", "⠙", "⠚", "⠞", "⠖", "⠦", "⠴", "⠲", "⠳", "⠓"] },
  dots4: {
    interval: 80,
    frames: ["⠄", "⠆", "⠇", "⠋", "⠙", "⠸", "⠰", "⠠", "⠰", "⠸", "⠙", "⠋", "⠇", "⠆"],
  },
  dots5: {
    interval: 80,
    frames: ["⠋", "⠙", "⠚", "⠒", "⠂", "⠂", "⠒", "⠲", "⠴", "⠦", "⠖", "⠒", "⠐", "⠐", "⠒", "⠓", "⠋"],
  },
  dots6: {
    interval: 80,
    frames: [
      "⠁",
      "⠉",
      "⠙",
      "⠚",
      "⠒",
      "⠂",
      "⠂",
      "⠒",
      "⠲",
      "⠴",
      "⠤",
      "⠄",
      "⠄",
      "⠤",
      "⠴",
      "⠲",
      "⠒",
      "⠂",
      "⠂",
      "⠒",
      "⠚",
      "⠙",
      "⠉",
      "⠁",
    ],
  },
  dots7: {
    interval: 80,
    frames: [
      "⠈",
      "⠉",
      "⠋",
      "⠓",
      "⠒",
      "⠐",
      "⠐",
      "⠒",
      "⠖",
      "⠦",
      "⠤",
      "⠠",
      "⠠",
      "⠤",
      "⠦",
      "⠖",
      "⠒",
      "⠐",
      "⠐",
      "⠒",
      "⠓",
      "⠋",
      "⠉",
      "⠈",
    ],
  },
  dots8: {
    interval: 80,
    frames: [
      "⠁",
      "⠁",
      "⠉",
      "⠙",
      "⠚",
      "⠒",
      "⠂",
      "⠂",
      "⠒",
      "⠲",
      "⠴",
      "⠤",
      "⠄",
      "⠄",
      "⠤",
      "⠠",
      "⠠",
      "⠤",
      "⠦",
      "⠖",
      "⠒",
      "⠐",
      "⠐",
      "⠒",
      "⠓",
      "⠋",
      "⠉",
      "⠈",
      "⠈",
    ],
  },
  dots9: { interval: 80, frames: ["⢹", "⢺", "⢼", "⣸", "⣇", "⡧", "⡗", "⡏"] },
  dots10: { interval: 80, frames: ["⢄", "⢂", "⢁", "⡁", "⡈", "⡐", "⡠"] },
  dots11: { interval: 100, frames: ["⠁", "⠂", "⠄", "⡀", "⢀", "⠠", "⠐", "⠈"] },
  dots13: { interval: 80, frames: ["⣼", "⣹", "⢻", "⠿", "⡟", "⣏", "⣧", "⣶"] },
  line: { interval: 130, frames: ["-", "\\", "|", "/"] },
  line2: { interval: 100, frames: ["⠂", "-", "–", "—", "–", "-"] },
  pipe: { interval: 100, frames: ["┤", "┘", "┴", "└", "├", "┌", "┬", "┐"] },
  simpleDots: { interval: 400, frames: [".  ", ".. ", "...", "   "] },
  simpleDotsScrolling: { interval: 200, frames: [".  ", ".. ", "...", " ..", "  .", "   "] },
  star: { interval: 70, frames: ["✶", "✸", "✹", "✺", "✹", "✷"] },
  star2: { interval: 80, frames: ["+", "x", "*"] },
  flip: { interval: 70, frames: ["_", "_", "_", "-", "`", "``", "'", "´", "-", "_", "_", "_"] },
  hamburger: { interval: 100, frames: ["☱", "☲", "☴"] },
  growVertical: { interval: 120, frames: ["▁", "▃", "▄", "▅", "▆", "▇", "▆", "▅", "▄", "▃"] },
  growHorizontal: {
    interval: 120,
    frames: ["▏", "▎", "▍", "▌", "▋", "▊", "▉", "▊", "▋", "▌", "▍", "▎"],
  },
  balloon: { interval: 140, frames: [" ", ".", "o", "O", "@", "*", " "] },
  balloon2: { interval: 120, frames: [".", "o", "O", "°", "O", "o", "."] },
  noise: { interval: 100, frames: ["▓", "▒", "░"] },
  bounce: { interval: 120, frames: ["⠁", "⠂", "⠄", "⠂"] },
  boxBounce: { interval: 120, frames: ["▖", "▘", "▝", "▗"] },
  boxBounce2: { interval: 100, frames: ["▌", "▀", "▐", "▄"] },
  triangle: { interval: 50, frames: ["◢", "◣", "◤", "◥"] },
  binary: {
    interval: 80,
    frames: [
      "010010",
      "001100",
      "100101",
      "111010",
      "111101",
      "010111",
      "101011",
      "111000",
      "110011",
      "110101",
    ],
  },
  arc: { interval: 100, frames: ["◜", "◠", "◝", "◞", "◡", "◟"] },
  circle: { interval: 120, frames: ["◡", "⊙", "◠"] },
  squareCorners: { interval: 180, frames: ["◰", "◳", "◲", "◱"] },
  circleQuarters: { interval: 120, frames: ["◴", "◷", "◶", "◵"] },
  circleHalves: { interval: 50, frames: ["◐", "◓", "◑", "◒"] },
  squish: { interval: 100, frames: ["╫", "╪"] },
  toggle: { interval: 250, frames: ["⊶", "⊷"] },
  toggle2: { interval: 80, frames: ["▫", "▪"] },
  toggle3: { interval: 120, frames: ["□", "■"] },
  toggle4: { interval: 100, frames: ["■", "□", "▪", "▫"] },
  toggle5: { interval: 100, frames: ["▮", "▯"] },
  toggle7: { interval: 80, frames: ["⦾", "⦿"] },
  toggle8: { interval: 100, frames: ["◍", "◌"] },
  toggle9: { interval: 100, frames: ["◉", "◎"] },
  toggle13: { interval: 80, frames: ["=", "*", "-"] },
  arrow: { interval: 100, frames: ["←", "↖", "↑", "↗", "→", "↘", "↓", "↙"] },
  arrow3: { interval: 120, frames: ["▹▹▹▹▹", "▸▹▹▹▹", "▹▸▹▹▹", "▹▹▸▹▹", "▹▹▹▸▹", "▹▹▹▹▸"] },
  bouncingBar: {
    interval: 80,
    frames: [
      "[    ]",
      "[=   ]",
      "[==  ]",
      "[=== ]",
      "[====]",
      "[ ===]",
      "[  ==]",
      "[   =]",
      "[    ]",
      "[   =]",
      "[  ==]",
      "[ ===]",
      "[====]",
      "[=== ]",
      "[==  ]",
      "[=   ]",
    ],
  },
  bouncingBall: {
    interval: 80,
    frames: [
      "( ●    )",
      "(  ●   )",
      "(   ●  )",
      "(    ● )",
      "(     ●)",
      "(    ● )",
      "(   ●  )",
      "(  ●   )",
      "( ●    )",
      "(●     )",
    ],
  },
  smiley: { interval: 200, frames: ["😄 ", "😝 "] },
  monkey: { interval: 300, frames: ["🙈 ", "🙈 ", "🙉 ", "🙊 "] },
  hearts: { interval: 100, frames: ["💛 ", "💙 ", "💜 ", "💚 ", "💗 "] },
  clock: {
    interval: 100,
    frames: ["🕛 ", "🕐 ", "🕑 ", "🕒 ", "🕓 ", "🕔 ", "🕕 ", "🕖 ", "🕗 ", "🕘 ", "🕙 ", "🕚 "],
  },
  earth: { interval: 180, frames: ["🌍 ", "🌎 ", "🌏 "] },
  moon: { interval: 80, frames: ["🌑 ", "🌒 ", "🌓 ", "🌔 ", "🌕 ", "🌖 ", "🌗 ", "🌘 "] },
  runner: { interval: 140, frames: ["🚶 ", "🏃 "] },
  pong: {
    interval: 80,
    frames: [
      "▐⠂       ▌",
      "▐⠈       ▌",
      "▐ ⠂      ▌",
      "▐ ⠠      ▌",
      "▐  ⡀     ▌",
      "▐  ⠠     ▌",
      "▐   ⠂    ▌",
      "▐   ⠈    ▌",
      "▐    ⠂   ▌",
      "▐    ⠠   ▌",
      "▐     ⡀  ▌",
      "▐     ⠠  ▌",
      "▐      ⠂ ▌",
      "▐      ⠈ ▌",
      "▐       ⠂▌",
      "▐       ⠠▌",
      "▐       ⡀▌",
      "▐      ⠠ ▌",
      "▐      ⠂ ▌",
      "▐     ⠈  ▌",
      "▐     ⠂  ▌",
      "▐    ⠠   ▌",
      "▐    ⡀   ▌",
      "▐   ⠠    ▌",
      "▐   ⠂    ▌",
      "▐  ⠈     ▌",
      "▐  ⠂     ▌",
      "▐ ⠠      ▌",
      "▐ ⡀      ▌",
      "▐⠠       ▌",
    ],
  },
  shark: {
    interval: 120,
    frames: [
      "▐|\\____________▌",
      "▐_|\\___________▌",
      "▐__|\\__________▌",
      "▐___|\\_________▌",
      "▐____|\\________▌",
      "▐_____|\\_______▌",
      "▐______|\\______▌",
      "▐_______|\\_____▌",
      "▐________|\\____▌",
      "▐_________|\\___▌",
      "▐__________|\\__▌",
      "▐___________|\\_▌",
      "▐____________|\\▌",
      "▐____________/|▌",
      "▐___________/|_▌",
      "▐__________/|__▌",
      "▐_________/|___▌",
      "▐________/|____▌",
      "▐_______/|_____▌",
      "▐______/|______▌",
      "▐_____/|_______▌",
      "▐____/|________▌",
      "▐___/|_________▌",
      "▐__/|__________▌",
      "▐_/|___________▌",
      "▐/|____________▌",
    ],
  },
  dqpb: { interval: 100, frames: ["d", "q", "p", "b"] },
  weather: {
    interval: 100,
    frames: [
      "☀️ ",
      "☀️ ",
      "☀️ ",
      "🌤 ",
      "⛅️ ",
      "🌥 ",
      "☁️ ",
      "🌧 ",
      "🌨 ",
      "🌧 ",
      "🌨 ",
      "🌧 ",
      "🌨 ",
      "⛈ ",
      "🌨 ",
      "🌧 ",
      "🌨 ",
      "☁️ ",
      "🌥 ",
      "⛅️ ",
      "🌤 ",
      "☀️ ",
      "☀️ ",
    ],
  },
  christmas: { interval: 400, frames: ["🌲", "🎄"] },
  point: { interval: 125, frames: ["∙∙∙", "●∙∙", "∙●∙", "∙∙●", "∙∙∙"] },
  layer: { interval: 150, frames: ["-", "=", "≡"] },
  betaWave: {
    interval: 80,
    frames: ["ρββββββ", "βρβββββ", "ββρββββ", "βββρβββ", "ββββρββ", "βββββρβ", "ββββββρ"],
  },
  aesthetic: {
    interval: 80,
    frames: [
      "▰▱▱▱▱▱▱",
      "▰▰▱▱▱▱▱",
      "▰▰▰▱▱▱▱",
      "▰▰▰▰▱▱▱",
      "▰▰▰▰▰▱▱",
      "▰▰▰▰▰▰▱",
      "▰▰▰▰▰▰▰",
      "▰▱▱▱▱▱▱",
    ],
  },
  sand: {
    interval: 80,
    frames: [
      "⠁",
      "⠂",
      "⠄",
      "⡀",
      "⡈",
      "⡐",
      "⡠",
      "⣀",
      "⣁",
      "⣂",
      "⣄",
      "⣌",
      "⣔",
      "⣤",
      "⣥",
      "⣦",
      "⣮",
      "⣶",
      "⣷",
      "⣿",
      "⡿",
      "⠿",
      "⢟",
      "⠟",
      "⡛",
      "⠛",
      "⠫",
      "⢋",
      "⠋",
      "⠍",
      "⡉",
      "⠉",
      "⠑",
      "⠡",
      "⢁",
    ],
  },
} as const;

export type SpinnerName = keyof typeof spinners;

// ─── Color generator types (port of utils.ts) ────────────────────────────────

export type ColorGenerator = (
  frameIndex: number,
  charIndex: number,
  totalFrames: number,
  totalChars: number,
) => string;

/** Cycles through a list of colors per frame tick. */
export function createPulse(colors: string[], speed = 1.0): ColorGenerator {
  return (frameIndex: number) => {
    const adjustedFrame = Math.floor(frameIndex * speed);
    return colors[adjustedFrame % colors.length] ?? colors[0];
  };
}

/** Produces a wave pattern that moves across characters. */
export function createWave(colors: string[]): ColorGenerator {
  return (frameIndex: number, charIndex: number, _totalFrames: number, totalChars: number) => {
    const position = (charIndex + frameIndex) % totalChars;
    const colorIndex = Math.floor((position / totalChars) * colors.length);
    return colors[colorIndex] ?? colors[0];
  };
}

// ─── Spinner component ────────────────────────────────────────────────────────

export interface SpinnerProps {
  /** One of the built-in spinner names. Defaults to "dots". */
  name?: SpinnerName;
  /** Override with custom frames instead of a named spinner. */
  frames?: string[];
  /** Override the frame interval in ms. */
  interval?: number;
  /** Whether to animate automatically. Defaults to true. */
  autoplay?: boolean;
  /** CSS color string or a ColorGenerator function for per-character coloring. */
  color?: string | ColorGenerator;
  /** CSS class name applied to the root element. */
  className?: string;
}

export function Spinner({
  name = "dots",
  frames: framesProp,
  interval: intervalProp,
  autoplay = true,
  color = "currentColor",
  className,
}: SpinnerProps) {
  const spinner = spinners[name];
  const frames = framesProp ?? spinner.frames;
  const interval = intervalProp ?? spinner.interval;
  const totalFrames = frames.length;

  const [frameIndex, setFrameIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!autoplay) return;
    intervalRef.current = setInterval(() => {
      setFrameIndex((i) => (i + 1) % totalFrames);
    }, interval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoplay, interval, totalFrames]);

  const currentFrame = frames[frameIndex] ?? "";
  const chars = [...currentFrame]; // split on grapheme clusters so emoji work

  if (typeof color === "function") {
    return (
      <output
        aria-label="loading"
        aria-live="polite"
        className={className}
        style={{ fontFamily: "monospace", whiteSpace: "pre" }}
      >
        {chars.map((ch, charIndex) => {
          // Chars within a single rendered frame are purely positional — index key is intentional
          const key = `${frameIndex}:${charIndex}`;
          return (
            <span
              key={key}
              style={{ color: color(frameIndex, charIndex, totalFrames, chars.length) }}
            >
              {ch}
            </span>
          );
        })}
      </output>
    );
  }

  return (
    <output
      aria-label="loading"
      aria-live="polite"
      className={className}
      style={{ fontFamily: "monospace", whiteSpace: "pre", color }}
    >
      {currentFrame}
    </output>
  );
}
