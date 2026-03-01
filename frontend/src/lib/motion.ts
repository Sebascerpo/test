import type { Transition } from "framer-motion";

export const easeSnappy: [number, number, number, number] = [
  0.22, 1, 0.36, 1,
];
export const easeSmooth: [number, number, number, number] = [0.2, 0, 0, 1];

export const transitions = {
  enterFadeUp: (reduce: boolean, delay = 0): Transition =>
    reduce
      ? { duration: 0.12, delay, ease: easeSmooth }
      : { duration: 0.26, delay, ease: easeSnappy },
  sheetSpring: (reduce: boolean): Transition =>
    reduce
      ? { duration: 0.12, ease: easeSmooth }
      : { type: "spring", damping: 32, stiffness: 340, mass: 0.78 },
  buttonPress: { scale: 0.985 } as const,
  listStagger: (index: number, reduce: boolean): Transition =>
    reduce
      ? { duration: 0.12, ease: easeSmooth }
      : { duration: 0.35, delay: index * 0.05, ease: easeSnappy },
};
