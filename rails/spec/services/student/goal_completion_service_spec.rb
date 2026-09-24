# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::GoalCompletionService, type: :model do
  subject(:service) do
    described_class.new(
      user: user,
      goal_id: goal.id
    )
  end

  let!(:prefecture) do
    create(
      :prefecture,
      name: '東京都'
    )
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

  describe '#call' do
    context 'goalが存在しない場合' do
      subject(:service) do
        described_class.new(
          user: user,
          goal_id: 999_999
        )
      end

      it 'RecordNotFoundになる' do
        expect { service.call }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end

    context 'タスクが1件もない場合' do
      it 'not_startedを返す' do
        expect(service.call).to eq(:not_started)
      end
    end

    context '全タスクがnot_startedの場合' do
      before do
        create(:task, user: user, goal: goal, status: :not_started)
        create(:task, user: user, goal: goal, status: :not_started)
      end

      it 'not_startedを返す' do
        expect(service.call).to eq(:not_started)
      end
    end

    context '一部のタスクのみ着手済み・完了済みの場合' do
      before do
        create(:task, user: user, goal: goal, status: :not_started)
        create(:task, user: user, goal: goal, status: :in_progress)
      end

      it 'in_progressを返す' do
        expect(service.call).to eq(:in_progress)
      end
    end

    context '一部のタスクのみ完了済みの場合' do
      before do
        create(:task, user: user, goal: goal, status: :not_started)
        create(:task, user: user, goal: goal, status: :completed)
      end

      it 'in_progressを返す' do
        expect(service.call).to eq(:in_progress)
      end
    end

    context '全タスクが完了済みの場合' do
      before do
        create(:task, user: user, goal: goal, status: :completed)
        create(:task, user: user, goal: goal, status: :completed)
      end

      it 'completedを返す' do
        expect(service.call).to eq(:completed)
      end
    end
  end
end
