import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PerPageSelect } from "./PerPageSelect";

describe("PerPageSelect", () => {
  it("現在の値が表示される", () => {
    render(
      <PerPageSelect value={20} options={[10, 20, 50]} onChange={vi.fn()} />,
    );
    expect(screen.getByText("20件")).toBeInTheDocument();
  });

  it("optionsの選択肢が表示される", () => {
    render(
      <PerPageSelect value={20} options={[10, 20, 50]} onChange={vi.fn()} />,
    );
    fireEvent.mouseDown(screen.getByRole("combobox"));
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(screen.getByRole("option", { name: "50件" })).toBeInTheDocument();
  });

  it("選択するとonChangeがnumberで呼ばれる", () => {
    const onChange = vi.fn();
    render(
      <PerPageSelect value={10} options={[10, 20, 50]} onChange={onChange} />,
    );
    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "50件" }));
    expect(onChange).toHaveBeenCalledWith(50);
    expect(onChange).toHaveBeenCalledWith(expect.any(Number));
  });

  it("labelのデフォルトは「表示件数」", () => {
    render(
      <PerPageSelect value={10} options={[10, 20, 50]} onChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("表示件数")).toBeInTheDocument();
  });

  it("labelを指定すると上書きできる", () => {
    render(
      <PerPageSelect
        value={10}
        options={[10, 20, 50]}
        onChange={vi.fn()}
        label="件数"
      />,
    );
    expect(screen.getByLabelText("件数")).toBeInTheDocument();
  });
});
