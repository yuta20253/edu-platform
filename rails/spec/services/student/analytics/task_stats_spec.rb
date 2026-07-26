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
end
