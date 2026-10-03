# frozen_string_literal: true

require 'rails_helper'

RSpec.describe GoalsQuery, type: :model do
  let!(:user) { create(:user) }
  let!(:goal1) { create(:goal, user: user, due_date: Date.new(2026, 2, 15)) }
  let!(:goal2) { create(:goal, user: user, due_date: Date.new(2026, 2, 14)) }
  let!(:goal3) { create(:goal, user: user, due_date: Date.new(2026, 2, 13)) }
  let!(:goal4) { create(:goal, user: user, due_date: Date.new(2026, 2, 12)) }
  let!(:goal5) { create(:goal, user: user, due_date: Date.new(2026, 2, 11)) }
  let!(:goal6) { create(:goal, user: user, due_date: Date.new(2026, 2, 10)) }

  it '期限の近い順に並ぶ' do
    result = described_class.new(user.goals).due_soon.result
    expect(result).to eq([goal6, goal5, goal4, goal3, goal2, goal1])
  end

  it '５件以下が表示される' do
    result = described_class.new(user.goals).limit_five.result
    expect(result.size).to eq(5)
  end

  it '期限の近い5件が表示される' do
    result = described_class.new(user.goals).due_soon.limit_five.result
    expect(result).to eq([goal6, goal5, goal4, goal3, goal2])
    expect(result.size).to eq(5)
  end

  describe '#within_period' do
    let!(:goal_before_range) { create(:goal, user: user, due_date: Date.new(2026, 2, 28)) }
    let!(:goal_at_from) { create(:goal, user: user, due_date: Date.new(2026, 3, 1)) }
    let!(:goal_within_range) { create(:goal, user: user, due_date: Date.new(2026, 3, 15)) }
    let!(:goal_at_to) { create(:goal, user: user, due_date: Date.new(2026, 3, 31)) }
    let!(:goal_after_range) { create(:goal, user: user, due_date: Date.new(2026, 4, 1)) }
    let!(:goal_without_due_date) { create(:goal, user: user, due_date: nil) }

    it '期間内のgoalのみ返る(境界値は含む)' do
      result = described_class.new(user.goals)
                              .within_period(from: Date.new(2026, 3, 1), to: Date.new(2026, 3, 31))
                              .result

      expect(result).to contain_exactly(goal_at_from, goal_within_range, goal_at_to)
    end

    it 'due_dateがnilのgoalは除外される' do
      result = described_class.new(user.goals)
                              .within_period(from: Date.new(2026, 1, 1), to: Date.new(2026, 12, 31))
                              .result

      expect(result).not_to include(goal_without_due_date)
    end
  end
end
