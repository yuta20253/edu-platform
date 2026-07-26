# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::Analytics::TaskCompletion, type: :model do
  describe '#call' do
    subject(:analytics) { described_class.new(user).call }

    let(:user) { create(:user) }
    let!(:goal) { create(:goal, user: user) }

    context 'タスクが存在する場合' do
      let!(:completed_task) do
        create(:task, :completed, user: user, goal: goal)
      end
      let!(:incomplete_task) do
        create(:task, user: user, goal: goal)
      end

      it 'タスク完了状況を返す' do
        expect(analytics).to eq(
          completed_count: 1,
          total_count: 2,
          completion_rate: 50.0
        )
      end
    end

    context 'タスクが存在しない場合' do
      it '0件として返す' do
        expect(analytics).to eq(
          completed_count: 0,
          total_count: 0,
          completion_rate: 0
        )
      end
    end
  end
end
