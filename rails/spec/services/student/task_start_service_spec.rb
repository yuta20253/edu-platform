# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::TaskStartService, type: :model do
  subject(:service) do
    described_class.new(
      user: user,
      task: task
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
      user: user,
      status: :not_started
    )
  end

  let!(:task) do
    create(
      :task,
      user: user,
      goal: goal,
      status: :not_started
    )
  end

  describe '#call' do
    context 'taskがnot_startedの場合' do
      it 'taskのstatusがin_progressに更新される' do
        service.call

        expect(task.reload.status).to eq('in_progress')
      end

      it '同じgoalに紐づくtaskが他にない場合、goalのstatusもin_progressに更新される' do
        service.call

        expect(goal.reload.status).to eq('in_progress')
      end
    end

    context 'taskが既にin_progressの場合' do
      let!(:task) do
        create(
          :task,
          user: user,
          goal: goal,
          status: :in_progress
        )
      end

      it 'taskのstatusは変わらない' do
        expect { service.call }.not_to(change { task.reload.status })
      end

      it 'goalのstatusは更新されない' do
        expect { service.call }.not_to(change { goal.reload.status })
      end
    end

    context 'taskが既にcompletedの場合' do
      let!(:task) do
        create(
          :task,
          user: user,
          goal: goal,
          status: :completed,
          completed_at: Time.current
        )
      end

      it 'taskのstatusは変わらない' do
        expect { service.call }.not_to(change { task.reload.status })
      end
    end

    context '同じgoalに完了済みのtaskと未着手のtaskが混在する場合' do
      let!(:other_task) do
        create(
          :task,
          user: user,
          goal: goal,
          status: :completed,
          completed_at: Time.current
        )
      end

      it 'goalのstatusがin_progressに更新される' do
        service.call

        expect(goal.reload.status).to eq('in_progress')
      end
    end
  end
end
