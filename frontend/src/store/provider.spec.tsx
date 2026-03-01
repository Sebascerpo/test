import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReduxProvider } from "@/store/provider";

describe("ReduxProvider", () => {
  it("renders children inside provider", () => {
    render(
      <ReduxProvider>
        <span>contenido</span>
      </ReduxProvider>,
    );

    expect(screen.getByText("contenido")).toBeInTheDocument();
  });
});
