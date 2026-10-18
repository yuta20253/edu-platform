# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::Analytics::TaskCompletion, type: :model do
  describe '#call' do
    subject(:analytics) { described_class.new(user).call }

    let(:user) { create(:user) }
    let!(:goal) { create(:goal, user: user) }

    context 'タスクが存在する場合' do
      let!(:completed_task) do
        create(:task, :completed, user: user, goal: goal)
      end
      let!(:incomplete_task) do
        create(:task, user: user, goal: goal)
      end

      it 'タスク完了状況を返す' do
        expect(analytics).to eq(
          completed_count: 1,
          total_count: 2,
          completion_rate: 50.0
        )
      end
    end

    context 'タスクが存在しない場合' do
      it '0件として返す' do
        expect(analytics).to eq(
          completed_count: 0,
          total_count: 0,
          completion_rate: 0
        )
      end
    end
  end

  describe '#call(期間を指定した場合)' do
    subject(:analytics) do
      described_class.new(user, from: Date.new(2026, 10, 5), to: Date.new(2026, 10, 11)).call
    end

    let(:user) { create(:user) }
    let!(:goal) { create(:goal, user: user) }

    before do
      create(:task, :completed, user: user, goal: goal, due_date: Date.new(2026, 10, 6))
      create(:task, user: user, goal: goal, due_date: Date.new(2026, 10, 7))
      create(:task, user: user, goal: goal, due_date: Date.new(2026, 10, 8))
      create(:task, :completed, user: user, goal: goal, due_date: Date.new(2026, 10, 1))
    end

    it 'due_dateが期間内のタスクだけで完了状況を返す' do
      expect(analytics).to eq(
        completed_count: 1,
        total_count: 3,
        completion_rate: 33.3
      )
    end
  end
end
