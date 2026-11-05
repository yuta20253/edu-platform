import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { CreateStudent } from "./index";
import type { GradeOption } from "./types";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const ME_URL = "/api/teacher/me";
const CLASSES_URL = "/api/teacher/school-classes";

const grades: GradeOption[] = [
  {
    id: 1,
    year: 1,
    display_name: "1年",
    school_classes: [{ id: 10, name: "A組" }],
  },
  {
    id: 2,
    year: 2,
    display_name: "2年",
    school_classes: [{ id: 20, name: "A組" }],
  },
];

const me = (
  gradeScope: "own_grade" | "all_grades" | null,
  grade: { id: number } | null = { id: 2 },
) => ({
  data: {
    user: {
      grade,
      teacher_permission: gradeScope ? { grade_scope: gradeScope } : null,
    },
  },
});

type Responder = (url: string) => Promise<unknown>;

// 2本の取得は並列なので、呼び出し順ではなくURLごとに返す
const mockApi = (responder: Responder) => {
  vi.mocked(apiClient.get).mockImplementation(((url: string) =>
    responder(url)) as typeof apiClient.get);
};

const ok = (meResponse: ReturnType<typeof me>, classes = grades) =>
  mockApi((url) =>
    Promise.resolve(url === ME_URL ? meResponse : { data: classes }),
  );

const pending = () => new Promise<never>(() => {});
const fail = (status: number) => Promise.reject({ response: { status } });

const gradeNames = () => {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "学年" }));
  return screen.getAllByRole("option").map((option) => option.textContent);
};

const findForm = () => screen.findByRole("combobox", { name: "学年" });

describe("teacher/CreateStudent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockReset();
  });

  describe("現行の挙動(移行前後で変わらない)", () => {
    it("取得中はスピナーを表示し、フォームもエラーも表示しない", () => {
      mockApi(() => pending());
      render(<CreateStudent />);

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(
        screen.queryByRole("combobox", { name: "学年" }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("2つの取得が成功するとフォームを表示する", async () => {
      ok(me("all_grades"));
      render(<CreateStudent />);

      expect(await findForm()).toBeInTheDocument();
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("学年制限のある教員(own_grade)は、選択肢が自分の学年だけになる", async () => {
      ok(me("own_grade", { id: 2 }));
      render(<CreateStudent />);
      await findForm();

      expect(gradeNames()).toEqual(["2年"]);
    });

    it("all_grades の教員は全学年を選べる", async () => {
      ok(me("all_grades"));
      render(<CreateStudent />);
      await findForm();

      expect(gradeNames()).toEqual(["1年", "2年"]);
    });

    it("権限が無い(teacher_permission が null)教員は全学年を選べる", async () => {
      ok(me(null));
      render(<CreateStudent />);
      await findForm();

      expect(gradeNames()).toEqual(["1年", "2年"]);
    });

    // 仕様か不具合かは未解決(TSK-231 の「未解決の点」)。直さずに現行の挙動を固定する
    it("own_grade でも grade が null の教員は、全学年を選べる", async () => {
      ok(me("own_grade", null));
      render(<CreateStudent />);
      await findForm();

      expect(gradeNames()).toEqual(["1年", "2年"]);
    });

    it("学級が0件(空配列)のときもフォームを表示する(スピナーのままにしない)", async () => {
      ok(me("all_grades"), []);
      render(<CreateStudent />);

      expect(await findForm()).toBeInTheDocument();
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    it("/me が401のときは/loginに遷移し、エラーを表示しない", async () => {
      mockApi((url) =>
        url === ME_URL ? fail(401) : Promise.resolve({ data: grades }),
      );
      render(<CreateStudent />);

      await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("/me が500のときはエラーを表示し、フォームは表示しない(学年制限を不明なまま扱わない)", async () => {
      mockApi((url) =>
        url === ME_URL ? fail(500) : Promise.resolve({ data: grades }),
      );
      render(<CreateStudent />);

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(
        screen.queryByRole("combobox", { name: "学年" }),
      ).not.toBeInTheDocument();
      expect(pushMock).not.toHaveBeenCalled();
    });
  });

  describe("移行で変わる挙動", () => {
    it("/me は成功、学級一覧は未解決のあいだはスピナーを表示し、解決するとフォームを表示する", async () => {
      let resolveClasses: (value: unknown) => void = () => {};
      mockApi((url) =>
        url === ME_URL
          ? Promise.resolve(me("all_grades"))
          : new Promise((resolve) => {
              resolveClasses = resolve;
            }),
      );
      render(<CreateStudent />);

      await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
      // /me の応答が反映される時間を与えてもフォームは出ない
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(
        screen.queryByRole("combobox", { name: "学年" }),
      ).not.toBeInTheDocument();

      resolveClasses({ data: grades });

      expect(await findForm()).toBeInTheDocument();
    });

    it("学級一覧だけ401のときは、エラーを表示せず/loginに遷移し、フォームは表示しない", async () => {
      mockApi((url) =>
        url === ME_URL ? Promise.resolve(me("all_grades")) : fail(401),
      );
      render(<CreateStudent />);

      await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("combobox", { name: "学年" }),
      ).not.toBeInTheDocument();
    });

    it("/me の失敗は、再試行を押すと/me だけ再取得してフォームを表示する", async () => {
      let meCalls = 0;
      mockApi((url) => {
        if (url === CLASSES_URL) return Promise.resolve({ data: grades });
        meCalls += 1;
        return meCalls === 1 ? fail(500) : Promise.resolve(me("all_grades"));
      });
      render(<CreateStudent />);

      fireEvent.click(await screen.findByRole("button", { name: "再試行" }));

      expect(await findForm()).toBeInTheDocument();
      expect(meCalls).toBe(2);
      const classesCalls = vi
        .mocked(apiClient.get)
        .mock.calls.filter(([url]) => url === CLASSES_URL);
      expect(classesCalls).toHaveLength(1);
    });

    it("学級一覧の失敗はエラーを表示してフォームを出さず、再試行で学級一覧だけ再取得して復帰する", async () => {
      let classesCalls = 0;
      let meCalls = 0;
      mockApi((url) => {
        if (url === ME_URL) {
          meCalls += 1;
          return Promise.resolve(me("all_grades"));
        }
        classesCalls += 1;
        return classesCalls === 1
          ? fail(500)
          : Promise.resolve({ data: grades });
      });
      render(<CreateStudent />);

      fireEvent.click(await screen.findByRole("button", { name: "再試行" }));
      expect(
        screen.queryByRole("combobox", { name: "学年" }),
      ).not.toBeInTheDocument();

      expect(await findForm()).toBeInTheDocument();
      expect(classesCalls).toBe(2);
      expect(meCalls).toBe(1);
    });
  });
});
