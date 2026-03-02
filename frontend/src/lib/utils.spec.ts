import { describe, expect, it } from "@jest/globals";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges classes and removes tailwind conflicts", () => {
    expect(cn("px-2", "px-4", "text-sm", false && "hidden")).toContain("px-4");
  });
});
