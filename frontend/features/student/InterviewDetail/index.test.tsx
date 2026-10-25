import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { InterviewDetail } from "./index";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/components/ui/ToastProvider", () => ({
  useToast: () => ({ show: vi.fn() }),
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

// 送信とメッセージ一覧の表示だけを確かめるための最小のPresenter
vi.mock("./Presenter", () => ({
  Presenter: ({
    interview,
    messages,
    onSendMessage,
  }: {
    interview: { status: string };
    messages: { id: number; body: string }[];
    onSendMessage: (body: string) => void;
  }) => (
    <div data-testid="presenter">
      <span data-testid="status">{interview.status}</span>
      <ul>
        {messages.map((m) => (
          <li key={m.id}>{m.body}</li>
        ))}
      </ul>
      <button onClick={() => onSendMessage("新しい本文")}>送信</button>
    </div>
  ),
}));

const interview = { id: 1, status: "requested", lock_version: 3 };
const sentInterview = { id: 1, status: "scheduling", lock_version: 4 };
const message = { id: 100, body: "最初のメッセージ" };
const sentMessage = { id: 101, body: "新しい本文" };

// 面談の詳細(GET)の呼び出し回数ごとに、失敗や保留を差し込めるAPI。
// 面談とメッセージは Promise.all で取るため、URL と呼び出し回数で分岐する。
const api = {
  detailCalls: 0,
  posted: false,
  failures: new Map<number, number>(),
  gates: new Map<number, Promise<void>>(),
};

const setupApi = () => {
  api.detailCalls = 0;
  api.posted = false;
  api.failures = new Map();
  api.gates = new Map();

  vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
    if (url.endsWith("/messages")) {
      return {
        data: {
          interview_request_messages: api.posted
            ? [message, sentMessage]
            : [message],
          meta: {},
        },
      };
    }

    api.detailCalls += 1;
    const call = api.detailCalls;
    await api.gates.get(call);
    const status = api.failures.get(call);
    if (status) throw { response: { status } };
    return { data: api.posted ? sentInterview : interview };
  });
  vi.mocked(apiClient.post).mockImplementation(async () => {
    api.posted = true;
    return { data: {} };
  });
};

// 解決を手動で制御できる Promise(保留中の表示を確かめるため)
const deferred = () => {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

describe("student/InterviewDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 未消化の mock 実装が次のテストに漏れないようにする
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    setupApi();
  });

  it("取得中はスピナーを表示し、エラーは表示しない", () => {
    const gate = deferred();
    api.gates.set(1, gate.promise);

    render(<InterviewDetail interviewId="1" />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("取得に成功すると面談とメッセージを表示する", async () => {
    render(<InterviewDetail interviewId="1" />);

    expect(await screen.findByTestId("presenter")).toBeInTheDocument();
    expect(screen.getByTestId("status")).toHaveTextContent("requested");
    expect(screen.getByText("最初のメッセージ")).toBeInTheDocument();
  });

  it("取得に失敗するとエラーを表示する", async () => {
    api.failures.set(1, 500);

    render(<InterviewDetail interviewId="1" />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByTestId("presenter")).not.toBeInTheDocument();
  });

  it("初回描画では、エラー表示を出さずスピナーを出す", () => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    const html = renderToString(<InterviewDetail interviewId="1" />);

    expect(html).toContain('role="progressbar"');
    expect(html).not.toContain('role="alert"');
  });

  it("送信後の取り直しの間は、画面をスピナーに置き換えず前の内容を表示し続ける", async () => {
    render(<InterviewDetail interviewId="1" />);
    await screen.findByTestId("presenter");

    // 2回目の面談取得(送信後の取り直し)を保留にする
    const gate = deferred();
    api.gates.set(2, gate.promise);
    fireEvent.click(screen.getByRole("button", { name: "送信" }));

    await waitFor(() => expect(api.detailCalls).toBe(2));
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByTestId("status")).toHaveTextContent("requested");

    await act(async () => {
      gate.resolve();
    });
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("scheduling"),
    );
    expect(screen.getByText("新しい本文")).toBeInTheDocument();
  });
});
