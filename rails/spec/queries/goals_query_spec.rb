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
end
