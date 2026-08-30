import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Presenter } from "./Presenter";
import type { TeacherNotificationResultsData } from "./types";

const mockData: TeacherNotificationResultsData = [
  {
    id: 1,
    email: "sato@example.com",
    status: "sent",
    formatted_sent_at: "2025/06/04 10:30",
    sender_user: { id: 1, name: "佐藤先生" },
    receiver_user: { id: 2, name: "田中太郎" },
  },
  {
    id: 2,
    email: "suzuki@example.com",
    status: "failed",
    formatted_sent_at: null,
    sender_user: { id: 1, name: "佐藤先生" },
    receiver_user: { id: 3, name: "鈴木花子" },
  },
];

describe("TeacherNotificationResultsPresenter", () => {
  it("テーブルヘッダーに「送信日時」「送信者」「受信者」「メール」「ステータス」が表示される", () => {
    render(<Presenter data={mockData} />);
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toContain("送信日時");
    expect(headers).toContain("送信者");
    expect(headers).toContain("受信者");
    expect(headers).toContain("メール");
    expect(headers).toContain("ステータス");
  });

  it("data が行として正しくレンダリングされる", () => {
    render(<Presenter data={mockData} />);
    expect(screen.getByText("2025/06/04 10:30")).toBeInTheDocument();
    expect(screen.getAllByText("佐藤先生")).toHaveLength(2);
    expect(screen.getByText("田中太郎")).toBeInTheDocument();
    expect(screen.getByText("sato@example.com")).toBeInTheDocument();
    expect(screen.getByText("鈴木花子")).toBeInTheDocument();
    expect(screen.getByText("suzuki@example.com")).toBeInTheDocument();
  });

  it("formatted_sent_at が null のとき「-」が表示される", () => {
    render(<Presenter data={mockData} />);
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("status に応じたステータスチップが表示される", () => {
    render(<Presenter data={mockData} />);
    expect(screen.getByText("成功")).toBeInTheDocument();
    expect(screen.getByText("失敗")).toBeInTheDocument();
  });

  it("data が空のとき「送信された通知はありません」が表示される", () => {
    render(<Presenter data={[]} />);
    expect(
      screen.getByText("送信された通知はありません"),
    ).toBeInTheDocument();
  });
});
