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

    it '論理削除済み(deleted_atがある)taskは除外される' do
      task_deleted = create(:task, user: user, goal: goal, due_date: Date.new(2026, 3, 15), deleted_at: Time.current)

      result = described_class.new(user.tasks)
                              .within_period(from: Date.new(2026, 3, 1), to: Date.new(2026, 3, 31))
                              .result

      expect(result).not_to include(task_deleted)
    end
  end

  describe '#due_soon' do
    let!(:task_late) { create(:task, user: user, goal: goal, due_date: Date.new(2026, 3, 20)) }
    let!(:task_early) { create(:task, user: user, goal: goal, due_date: Date.new(2026, 3, 1)) }
    let!(:task_middle) { create(:task, user: user, goal: goal, due_date: Date.new(2026, 3, 10)) }

    it '期限の近い順に並ぶ' do
      result = described_class.new(user.tasks).due_soon.result

      expect(result).to eq([task_early, task_middle, task_late])
    end
  end

  describe '#includes_units' do
    let!(:task) { create(:task, user: user, goal: goal) }
    let!(:unit) { create(:unit) }

    before do
      create(:task_unit, task: task, unit: unit)
    end

    it '紐づく目標・Unit・UnitのCourseを読み込み済みにする' do
      result = described_class.new(user.tasks).includes_units.result.to_a
      loaded_task = result.first

      expect(loaded_task.association(:goal)).to be_loaded
      expect(loaded_task.association(:units)).to be_loaded
      expect(loaded_task.units.first.association(:course)).to be_loaded
    end
  end

  describe '#paginate' do
    before do
      create_list(:task, 3, user: user, goal: goal)
    end

    it '指定したページと件数で絞り込む' do
      result = described_class.new(user.tasks).paginate(page: 2, per_page: 2).result

      expect(result.size).to eq(1)
      expect(result.current_page).to eq(2)
      expect(result.total_pages).to eq(2)
      expect(result.total_count).to eq(3)
    end
  end

  describe 'メソッドチェーン' do
    let!(:task_late) { create(:task, user: user, goal: goal, due_date: Date.new(2026, 3, 20)) }
    let!(:task_early) { create(:task, user: user, goal: goal, due_date: Date.new(2026, 3, 1)) }
    let!(:task_middle) { create(:task, user: user, goal: goal, due_date: Date.new(2026, 3, 10)) }

    it '並び替え・読み込み・ページネーションを組み合わせられる' do
      result = described_class.new(user.tasks)
                              .due_soon
                              .includes_units
                              .paginate(page: 1, per_page: 2)
                              .result

      expect(result).to eq([task_early, task_middle])
    end
  end
end
