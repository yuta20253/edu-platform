# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::CreateDraftTaskService do
  subject { described_class.new(form) }

  let(:user) { create(:user) }
  let(:goal) { create(:goal, user: user) }
  let!(:unit1) { create(:unit) }
  let!(:unit2) { create(:unit) }

  let(:form) do
    instance_double(
      Student::CreateDraftTaskForm,
      current_user: user,
      goal: goal,
      title: '英文法基礎',
      content: '学習内容',
      priority: 3,
      parsed_due_date: Date.new(2026, 4, 11),
      memo: 'メモ',
      unit_ids: [unit1.id, unit2.id]
    )
  end

  describe '#call' do
    it 'TaskとTaskUnitが作成される' do
      expect do
        subject.call
      end.to change(DraftTask, :count).by(1)
                                      .and change(DraftTaskUnit, :count).by(2)

      draft_task = DraftTask.last
      expect(draft_task.units).to contain_exactly(unit1, unit2)
    end
  end
end
