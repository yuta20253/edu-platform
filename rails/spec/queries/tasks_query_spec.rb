# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TasksQuery, type: :model do
  let!(:user) { create(:user) }
  let!(:goal) { create(:goal, user: user) }

  describe '#within_period' do
    let!(:task_before_range) { create(:task, user: user, goal: goal, due_date: Date.new(2026, 2, 28)) }
    let!(:task_at_from) { create(:task, user: user, goal: goal, due_date: Date.new(2026, 3, 1)) }
    let!(:task_within_range) { create(:task, user: user, goal: goal, due_date: Date.new(2026, 3, 15)) }
    let!(:task_at_to) { create(:task, user: user, goal: goal, due_date: Date.new(2026, 3, 31)) }
    let!(:task_after_range) { create(:task, user: user, goal: goal, due_date: Date.new(2026, 4, 1)) }
    let!(:task_without_due_date) { create(:task, user: user, goal: goal, due_date: nil) }

    it '期間内のtaskのみ返る(境界値は含む)' do
      result = described_class.new(user.tasks)
                              .within_period(from: Date.new(2026, 3, 1), to: Date.new(2026, 3, 31))
                              .result

      expect(result).to contain_exactly(task_at_from, task_within_range, task_at_to)
    end

    it 'due_dateがnilのtaskは除外される' do
      result = described_class.new(user.tasks)
                              .within_period(from: Date.new(2026, 1, 1), to: Date.new(2026, 12, 31))
                              .result

      expect(result).not_to include(task_without_due_date)
    end
  end
end
