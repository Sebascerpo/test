import { describe, expect, it } from "@jest/globals";
import { transitions, easeSnappy, easeSmooth } from "@/lib/motion";

describe("motion transitions", () => {
  it("returns reduced enter transition when reduce=true", () => {
    const transition = transitions.enterFadeUp(true, 0.2);
    expect(transition).toEqual({
      duration: 0.12,
      delay: 0.2,
      ease: easeSmooth,
    });
  });

  it("returns animated enter transition when reduce=false", () => {
    const transition = transitions.enterFadeUp(false, 0.15);
    expect(transition).toEqual({
      duration: 0.26,
      delay: 0.15,
      ease: easeSnappy,
    });
  });

  it("returns reduced sheet transition when reduce=true", () => {
    const transition = transitions.sheetSpring(true);
    expect(transition).toEqual({
      duration: 0.12,
      ease: easeSmooth,
    });
  });

  it("returns spring sheet transition when reduce=false", () => {
    const transition = transitions.sheetSpring(false);
    expect(transition).toEqual({
      type: "spring",
      damping: 32,
      stiffness: 340,
      mass: 0.78,
    });
  });

  it("returns reduced list transition when reduce=true", () => {
    const transition = transitions.listStagger(3, true);
    expect(transition).toEqual({
      duration: 0.12,
      ease: easeSmooth,
    });
  });

  it("returns staggered list transition when reduce=false", () => {
    const transition = transitions.listStagger(3, false);
    expect(transition.duration).toBe(0.35);
    expect(transition.delay).toBeCloseTo(0.15, 8);
    expect(transition.ease).toEqual(easeSnappy);
  });
});
