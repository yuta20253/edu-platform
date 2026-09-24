# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::SubmissionService, type: :model do
  describe '#call' do
    subject(:service) { described_class.new(user: user, task_id: task.id) }

    let!(:user) { create(:user) }
    let!(:goal) { create(:goal, user: user, status: :not_started) }
    let!(:task) { create(:task, user: user, goal: goal, status: :not_started) }

    context '正常に完了する場合' do
      it 'taskとgoalのstatusが更新されること' do
        service.call

        expect(task.reload.status).to eq('completed')
        expect(goal.reload.status).to eq('completed')
      end

      it 'taskのstatusを返すこと' do
        expect(service.call).to eq(:completed)
      end
    end

    context 'goalの更新で例外が発生した場合' do
      before do
        allow_any_instance_of(Student::GoalStatusUpdaterService) # rubocop:disable RSpec/AnyInstance
          .to receive(:call)
          .and_raise(ActiveRecord::RecordInvalid)
      end

      it '例外が伝播すること' do
        expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
      end

      it 'taskの更新もロールバックされること' do
        expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)

        expect(task.reload.status).to eq('not_started')
        expect(task.completed_at).to be_nil
      end
    end
  end
end
