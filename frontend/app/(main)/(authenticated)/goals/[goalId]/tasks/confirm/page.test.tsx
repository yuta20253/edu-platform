import { isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CreateTaskConfirmPage from "./page";

// notFound() は例外を投げて描画を打ち切るので、同じように投げるモックにする
const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  notFound: () => notFoundMock(),
}));

vi.mock("@/features/student/CreateTaskConfirm", () => ({
  CreateTaskConfirm: () => null,
}));

const renderPage = (
  goalId: string,
  draftTaskId: string | string[] | undefined,
) =>
  CreateTaskConfirmPage({
    params: Promise.resolve({ goalId }),
    searchParams: Promise.resolve({ draft_task_id: draftTaskId }),
  });

describe("CreateTaskConfirmPage", () => {
  beforeEach(() => {
    notFoundMock.mockClear();
  });

  it("goalId と draft_task_id が正しい数値なら、数値にして CreateTaskConfirm に渡す", async () => {
    const element = await renderPage("9", "1");

    expect(notFoundMock).not.toHaveBeenCalled();
    expect(isValidElement(element)).toBe(true);
    expect(element.props).toEqual({ goalId: 9, draftTaskId: 1 });
  });

  it.each([
    ["goalId が英字", "abc", "1"],
    ["goalId が 0", "0", "1"],
    ["goalId が空", "", "1"],
    ["draft_task_id が無い", "9", undefined],
    ["draft_task_id が空", "9", ""],
    ["draft_task_id が英字", "9", "abc"],
    ["draft_task_id が 0", "9", "0"],
    ["draft_task_id が配列(同じキーが繰り返された)", "9", ["1", "2"]],
  ])("%s のときは 404 にする", async (_name, goalId, draftTaskId) => {
    await expect(renderPage(goalId, draftTaskId)).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
