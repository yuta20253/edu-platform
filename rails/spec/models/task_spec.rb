# frozen_string_literal: true

# == Schema Information
#
# Table name: tasks
#
#  id             :bigint           not null, primary key
#  user_id        :bigint           not null
#  goal_id        :bigint
#  title          :string(100)      not null
#  content        :text(65535)      not null
#  priority       :integer          default("normal"), not null
#  due_date       :date
#  estimated_time :integer
#  status         :integer          default("not_started"), not null
#  memo           :text(65535)
#  completed_at   :datetime
#  deleted_at     :datetime
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#
require 'rails_helper'

RSpec.describe Task, type: :model do
  describe 'enum' do
    it { is_expected.to define_enum_for(:priority).with_values(very_low: 1, low: 2, normal: 3, high: 4, very_high: 5) }
    it { is_expected.to define_enum_for(:status).with_values(not_started: 0, in_progress: 1, completed: 2) }
  end

  describe '.by_status' do
    let!(:prefecture) { create(:prefecture, name: '東京都') }
    let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }
    let!(:user) { create(:user, high_school: high_school) }
    let!(:goal) { create(:goal, user: user) }
    let!(:course) { create(:course) }
    let!(:units) { create_list(:unit, 3, course: course) }
    let!(:not_started_task) { create(:task, status: :not_started, user: user, goal: goal, units: units) }
    let!(:in_progress_task) { create(:task, status: :in_progress, user: user, goal: goal, units: units) }
    let!(:completed_task) { create(:task, status: :completed, user: user, goal: goal, units: units) }

    context 'statusが指定されている場合' do
      it 'completedのみ返す' do
        result = described_class.by_status('completed')

        expect(result).to contain_exactly(completed_task)
      end

      it 'in_progressのみ返す' do
        result = described_class.by_status('in_progress')

        expect(result).to contain_exactly(in_progress_task)
      end

      it 'not_startedのみ返す' do
        result = described_class.by_status('not_started')

        expect(result).to contain_exactly(not_started_task)
      end
    end

    context 'statusが未指定の場合' do
      it '未完了タスクのみ返す' do
        result = described_class.by_status(nil)

        expect(result).to include(not_started_task, in_progress_task)
        expect(result).not_to include(completed_task)
      end
    end
  end

  describe 'callbacks' do
    let!(:prefecture) do
      create(:prefecture, name: '東京都')
    end

    let!(:high_school) do
      create(
        :high_school,
        name: 'A高校',
        prefecture: prefecture
      )
    end

    let!(:user) do
      create(
        :user,
        high_school: high_school
      )
    end

    let!(:goal) do
      create(
        :goal,
        user: user
      )
    end

    it 'completedならcompleted_atが入る' do
      task = create(
        :task,
        user: user,
        goal: goal,
        status: :completed
      )

      expect(task.completed_at).to be_present
    end

    it 'not_startedならcompleted_atはnil' do
      task = create(
        :task,
        user: user,
        goal: goal,
        status: :not_started
      )

      expect(task.completed_at).to be_nil
    end
  end
end
