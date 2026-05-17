# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::TaskStatusUpdaterService, type: :model do
  subject(:service) do
    described_class.new(
      user: user,
      task_id: task.id,
      status: status
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

  let!(:task) do
    create(
      :task,
      user: user,
      goal: goal,
      status: :not_started,
      completed_at: nil
    )
  end

  describe '#call' do
    context 'statusがcompletedの場合' do
      let(:status) { :completed }

      it 'taskのstatusがcompletedに更新される' do
        service.call

        expect(task.reload.status).to eq('completed')
      end

      it 'completed_atが更新される' do
        before_time = Time.current

        service.call

        after_time = Time.current

        expect(task.reload.completed_at).to be_between(
          before_time,
          after_time
        )
      end
    end

    context 'statusがin_progressの場合' do
      let(:status) { :in_progress }

      before do
        task.update!(
          completed_at: 1.day.ago
        )
      end

      it 'taskのstatusがin_progressに更新される' do
        service.call

        expect(task.reload.status).to eq('in_progress')
      end

      it 'completed_atがnilになる' do
        service.call

        expect(task.reload.completed_at).to be_nil
      end
    end

    context 'statusがnot_startedの場合' do
      let(:status) { :not_started }

      before do
        task.update!(
          completed_at: 1.day.ago
        )
      end

      it 'taskのstatusがnot_startedに更新される' do
        service.call

        expect(task.reload.status).to eq('not_started')
      end

      it 'completed_atがnilになる' do
        service.call

        expect(task.reload.completed_at).to be_nil
      end
    end

    context '他人のtask_idを指定した場合' do
      subject(:service) do
        described_class.new(
          user: user,
          task_id: other_task.id,
          status: status
        )
      end

      let!(:other_user) do
        create(
          :user,
          high_school: high_school
        )
      end

      let!(:other_goal) do
        create(
          :goal,
          user: other_user
        )
      end

      let!(:other_task) do
        create(
          :task,
          user: other_user,
          goal: other_goal
        )
      end

      let(:status) { :completed }

      it 'ActiveRecord::RecordNotFoundが発生する' do
        expect do
          service.call
        end.to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end
end
