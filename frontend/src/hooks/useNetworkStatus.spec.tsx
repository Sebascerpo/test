import { render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it } from "@jest/globals";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

function NetworkStatusProbe() {
  const { isOnline } = useNetworkStatus();
  return <span>{isOnline ? "online" : "offline"}</span>;
}

describe("useNetworkStatus", () => {
  it("reacts to browser online/offline events", () => {
    render(<NetworkStatusProbe />);
    expect(screen.getByText(/online|offline/)).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByText("offline")).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.getByText("online")).toBeInTheDocument();
  });
});
