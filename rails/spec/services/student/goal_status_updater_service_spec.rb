# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::GoalStatusUpdaterService, type: :model do
  subject(:service) do
    described_class.new(
      user: user,
      goal_id: goal.id,
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
      user: user,
      status: :not_started
    )
  end

  describe '#call' do
    context 'statusがcompletedの場合' do
      let(:status) { :completed }

      it 'goalのstatusがcompletedに更新される' do
        service.call

        expect(goal.reload.status).to eq('completed')
      end
    end

    context 'statusがin_progressの場合' do
      let(:status) { :in_progress }

      it 'goalのstatusがin_progressに更新される' do
        service.call

        expect(goal.reload.status).to eq('in_progress')
      end
    end

    context 'statusがnot_startedの場合' do
      let(:status) { :not_started }

      before do
        goal.update!(status: :in_progress)
      end

      it 'goalのstatusがnot_startedに更新される' do
        service.call

        expect(goal.reload.status).to eq('not_started')
      end
    end

    context '他人のgoal_idを指定した場合' do
      subject(:service) do
        described_class.new(
          user: user,
          goal_id: other_goal.id,
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

      let(:status) { :completed }

      it 'ActiveRecord::RecordNotFoundが発生する' do
        expect do
          service.call
        end.to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end
end
