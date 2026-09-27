# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Goal, type: :model do
  describe '#soft_delete!' do
    let(:goal) { create(:goal) }

    context 'タスクがない場合' do
      it '削除できる' do
        expect { goal.soft_delete! }.to change { goal.reload.deleted_at }.from(nil)
      end
    end

    context '未着手のタスクのみ紐づく場合' do
      before { create(:task, user: goal.user, goal: goal, status: :not_started) }

      it '削除できる' do
        expect { goal.soft_delete! }.to change { goal.reload.deleted_at }.from(nil)
      end
    end

    context '進行中のタスクが紐づく場合' do
      before { create(:task, :in_progress, user: goal.user, goal: goal) }

      it 'Goal::HasActiveTasksErrorを送出する' do
        expect { goal.soft_delete! }.to raise_error(Goal::HasActiveTasksError)
      end

      it '削除されない' do
        begin
          goal.soft_delete!
        rescue Goal::HasActiveTasksError
          nil
        end

        expect(goal.reload.deleted_at).to be_nil
      end
    end

    context '完了済みのタスクが紐づく場合' do
      before { create(:task, :completed, user: goal.user, goal: goal) }

      it 'Goal::HasActiveTasksErrorを送出する' do
        expect { goal.soft_delete! }.to raise_error(Goal::HasActiveTasksError)
      end
    end
  end
end
