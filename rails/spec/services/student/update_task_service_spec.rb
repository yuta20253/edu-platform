# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::UpdateTaskService, type: :model do
  subject(:service) { described_class.new(form) }

  let(:user) { create(:user) }
  let(:task) { create(:task, user: user) }

  let(:unit1) { create(:unit) }
  let(:unit2) { create(:unit) }
  let(:unit3) { create(:unit) }

  let(:form) do
    instance_double(
      Student::UpdateTaskForm,
      task: task,
      title: '新タイトル',
      content: '新内容',
      priority: 'high',
      parsed_due_date: Date.parse('2026-12-31'),
      memo: '新メモ',
      unit_ids: [unit2.id, unit3.id],
      unit_ids_provided: true,
      errors: ActiveModel::Errors.new(self)
    )
  end

  before do
    # 既存の紐付け
    task.task_units.create!(unit: unit1)
    task.task_units.create!(unit: unit2)
  end

  describe '#call' do
    context '正常系' do
      it 'taskが更新される' do
        service.call
        task.reload

        expect(task.title).to eq '新タイトル'
        expect(task.content).to eq '新内容'
        expect(task.priority).to eq 'high'
        expect(task.memo).to eq '新メモ'
        expect(task.due_date).to eq Date.parse('2026-12-31')
      end

      it 'unitの差分更新が行われる' do
        service.call
        task.reload

        expect(task.unit_ids).to contain_exactly(unit2.id, unit3.id)
      end

      it 'trueを返す' do
        expect(service.call).to be true
      end
    end

    context 'unit_ids_providedがfalse' do
      before do
        allow(form).to receive(:unit_ids_provided).and_return(false)
      end

      it 'unitは更新されない' do
        original_ids = task.unit_ids

        service.call
        task.reload

        expect(task.unit_ids).to match_array(original_ids)
      end
    end

    context '追加のみ発生する場合' do
      before do
        allow(form).to receive(:unit_ids).and_return([unit1.id, unit2.id, unit3.id])
      end

      it 'unitが追加される' do
        service.call
        task.reload

        expect(task.unit_ids).to contain_exactly(unit1.id, unit2.id, unit3.id)
      end
    end

    context '削除のみ発生する場合' do
      before do
        allow(form).to receive(:unit_ids).and_return([unit2.id])
      end

      it 'unitが削除される' do
        service.call
        task.reload

        expect(task.unit_ids).to contain_exactly(unit2.id)
      end
    end

    context 'updateで例外が発生した場合' do
      before do
        allow(task).to receive(:update!).and_raise(ActiveRecord::RecordInvalid.new(task))
      end

      it 'falseを返す' do
        expect(service.call).to be false
      end

      it 'errorsに追加される' do
        service.call
        expect(form.errors[:base]).to be_present
      end

      it 'unit更新は行われない（トランザクション）' do
        expect do
          service.call
        end.not_to(change { task.task_units.count })
      end
    end

    context 'insert_allで例外が発生した場合' do
      before do
        allow(task.task_units).to receive(:insert_all!).and_raise(ActiveRecord::RecordInvalid.new(task))
      end

      it 'ロールバックされる' do
        original_ids = task.unit_ids

        begin
          service.call
        rescue StandardError
          nil
        end
        task.reload

        expect(task.unit_ids).to match_array(original_ids)
      end
    end
  end
end
