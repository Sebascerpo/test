import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ValidationToast } from "@/components/ui/ValidationToast";

describe("ValidationToast tones", () => {
  it("uses declined tone by default", () => {
    render(
      <ValidationToast message="Error de validación" onClear={vi.fn()} />,
    );

    const text = screen.getByText("Error de validación");
    const card = text.closest(".toast-content");
    expect(card).toHaveClass("toast--declined");
  });

  it("supports pending tone", () => {
    render(
      <ValidationToast
        message="Esperando reconexión"
        onClear={vi.fn()}
        tone="pending"
      />,
    );

    const text = screen.getByText("Esperando reconexión");
    const card = text.closest(".toast-content");
    expect(card).toHaveClass("toast--pending");
  });

  it("supports approved tone", () => {
    render(
      <ValidationToast
        message="Pago aprobado"
        onClear={vi.fn()}
        tone="approved"
      />,
    );

    const text = screen.getByText("Pago aprobado");
    const card = text.closest(".toast-content");
    expect(card).toHaveClass("toast--approved");
  });
});
