import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SlideInDrawer } from "./SlideInDrawer";

describe("SlideInDrawer", () => {
  it("openがtrueのとき子要素が表示される", () => {
    render(
      <SlideInDrawer open onClose={vi.fn()}>
        <div>ドロワーの中身</div>
      </SlideInDrawer>,
    );
    expect(screen.getByText("ドロワーの中身")).toBeInTheDocument();
  });

  it("openがfalseのとき子要素が表示されない", () => {
    render(
      <SlideInDrawer open={false} onClose={vi.fn()}>
        <div>ドロワーの中身</div>
      </SlideInDrawer>,
    );
    expect(screen.queryByText("ドロワーの中身")).not.toBeInTheDocument();
  });

  it("anchorはrightで幅480pxのpaperになる", () => {
    render(
      <SlideInDrawer open onClose={vi.fn()}>
        <div>ドロワーの中身</div>
      </SlideInDrawer>,
    );
    expect(document.querySelector(".MuiDrawer-paperAnchorRight")).toHaveStyle({
      width: "480px",
    });
  });
});
