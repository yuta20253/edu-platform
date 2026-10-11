# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::Analytics::TaskStats do
  describe '#completed_count, #total_count' do
    subject(:task_stats) { described_class.new(user) }

    let!(:user) { create(:user) }
    let!(:goal) { create(:goal, user: user) }

    let!(:completed_task) do
      create(:task, :completed, user: user, goal: goal)
    end

    let!(:incomplete_task) do
      create(:task, user: user, goal: goal)
    end

    it '完了数を返す' do
      expect(task_stats.completed_count).to eq(1)
    end

    it '総数を返す' do
      expect(task_stats.total_count).to eq(2)
    end
  end

  describe '期間を指定した場合' do
    subject(:task_stats) do
      described_class.new(user, from: Date.new(2026, 10, 5), to: Date.new(2026, 10, 11))
    end

    let!(:user) { create(:user) }
    let!(:goal) { create(:goal, user: user) }

    before do
      # 期間内(両端を含む)
      create(:task, :completed, user: user, goal: goal, due_date: Date.new(2026, 10, 5))
      create(:task, user: user, goal: goal, due_date: Date.new(2026, 10, 11))
      create(:task, :in_progress, user: user, goal: goal, due_date: Date.new(2026, 10, 8))
      # 期間外
      create(:task, :completed, user: user, goal: goal, due_date: Date.new(2026, 10, 4))
      create(:task, :completed, user: user, goal: goal, due_date: Date.new(2026, 10, 12))
      # 期限なし
      create(:task, :completed, user: user, goal: goal, due_date: nil)
    end

    it 'due_dateが期間内のタスクの完了数を返す' do
      expect(task_stats.completed_count).to eq(1)
    end

    it 'due_dateが期間内のタスクの総数を返す(期間外・期限なしは除く)' do
      expect(task_stats.total_count).to eq(3)
    end
  end

  describe '期間を指定しない場合' do
    subject(:task_stats) { described_class.new(user) }

    let!(:user) { create(:user) }
    let!(:goal) { create(:goal, user: user) }

    before do
      create(:task, :completed, user: user, goal: goal, due_date: Date.new(2020, 1, 1))
      create(:task, user: user, goal: goal, due_date: nil)
    end

    it '期限なしを含む全タスクを数える(累計)' do
      expect(task_stats.completed_count).to eq(1)
      expect(task_stats.total_count).to eq(2)
    end
  end
end
