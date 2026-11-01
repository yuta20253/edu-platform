import { isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CreateTaskPage from "./page";

// notFound() は例外を投げて描画を打ち切るので、同じように投げるモックにする
const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  notFound: () => notFoundMock(),
}));

vi.mock("@/features/student/CreateTask", () => ({
  CreateTask: () => null,
}));

const renderPage = (
  goalId: string,
  draftTaskId: string | string[] | undefined,
) =>
  CreateTaskPage({
    params: Promise.resolve({ goalId }),
    searchParams: Promise.resolve({ draftTaskId }),
  });

describe("CreateTaskPage", () => {
  beforeEach(() => {
    notFoundMock.mockClear();
  });

  it("draftTaskId が無いときは、新規作成として draftTaskId=null を渡す", async () => {
    const element = await renderPage("9", undefined);

    expect(notFoundMock).not.toHaveBeenCalled();
    expect(isValidElement(element)).toBe(true);
    expect((element as React.ReactElement).props).toEqual({
      goalId: 9,
      draftTaskId: null,
    });
  });

  it("goalId と draftTaskId が正しい数値なら、数値にして渡す", async () => {
    const element = await renderPage("9", "5");

    expect(notFoundMock).not.toHaveBeenCalled();
    expect((element as React.ReactElement).props).toEqual({
      goalId: 9,
      draftTaskId: 5,
    });
  });

  it.each([
    ["goalId が英字", "abc", "5"],
    ["goalId が 0", "0", "5"],
    ["goalId が空", "", "5"],
    ["draftTaskId が空", "9", ""],
    ["draftTaskId が英字", "9", "abc"],
    ["draftTaskId が 0", "9", "0"],
    ["draftTaskId が配列(同じキーが繰り返された)", "9", ["1", "2"]],
  ])("%s のときは 404 にする", async (_name, goalId, draftTaskId) => {
    await expect(renderPage(goalId, draftTaskId)).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
