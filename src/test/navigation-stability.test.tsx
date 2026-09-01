import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import BottomNav from "@/components/layout/BottomNav";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function Page({ name }: { name: string }) {
  return <div data-testid="page">{name}</div>;
}

function Harness() {
  return (
    <MemoryRouter initialEntries={["/dashboard"]}>
      <ErrorBoundary>
        <ScrollToTop />
        <Routes>
          <Route path="/dashboard" element={<Page name="Dashboard" />} />
          <Route path="/chat" element={<Page name="Chat" />} />
          <Route path="/focus" element={<Page name="Focus" />} />
          <Route path="/news" element={<Page name="News" />} />
          <Route path="/resources" element={<Page name="Library" />} />
          <Route path="/profile" element={<Page name="Profile" />} />
        </Routes>
        <BottomNav />
      </ErrorBoundary>
    </MemoryRouter>
  );
}

describe("navigation stability", () => {
  it("survives repeated rapid taps across sections", async () => {
    render(<Harness />);

    const order = ["Chat", "Home", "Focus", "News", "Library", "Profile"];

    for (let round = 0; round < 10; round++) {
      for (const label of order) {
        const link = screen.getByRole("link", { name: label });
        // Fire three taps back-to-back to simulate impatient clicking.
        await act(async () => {
          link.click();
          link.click();
          link.click();
        });
      }
    }

    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
    expect(screen.getByTestId("page")).toBeInTheDocument();
  });

  it("blocks stacked transitions within the nav lock window", async () => {
    render(<Harness />);

    const chat = screen.getByRole("link", { name: "Chat" });
    await act(async () => {
      chat.click();
    });
    expect(screen.getByTestId("page")).toHaveTextContent("Chat");

    // Immediate second tap on a different item is swallowed by the lock.
    const focus = screen.getByRole("link", { name: "Focus" });
    await act(async () => {
      focus.click();
    });
    expect(screen.getByTestId("page")).toHaveTextContent("Chat");
  });
});
