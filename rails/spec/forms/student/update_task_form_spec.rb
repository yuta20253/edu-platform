# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::UpdateTaskForm, type: :model do
  subject(:form) { described_class.new(task: task, **params) }

  let(:user) { create(:user) }
  let(:task) { create(:task, user: user) }
  let(:unit1) { create(:unit) }
  let(:unit2) { create(:unit) }

  let(:params) do
    {
      title: 'タイトル',
      content: '内容',
      due_date: '2026-12-31',
      priority: '1',
      unit_ids: [unit1.id, unit2.id]
    }
  end

  describe '#valid?' do
    context '正常系' do
      it '有効な場合はtrue' do
        expect(form).to be_valid
      end
    end

    context 'titleが空' do
      before { params[:title] = '' }

      it 'エラーになる' do
        expect(form).to be_invalid
        expect(form.errors[:title]).to be_present
        expect(form.errors.full_messages).to include('タイトル を入力してください')
      end
    end

    context 'contentが空' do
      before { params[:content] = '' }

      it 'エラーになる' do
        expect(form).to be_invalid
        expect(form.errors[:content]).to be_present
        expect(form.errors.full_messages).to include('内容 を入力してください')
      end
    end

    context 'due_dateが空' do
      before { params[:due_date] = '' }

      it 'エラーになる' do
        expect(form).to be_invalid
        expect(form.errors[:due_date]).to be_present
        expect(form.errors.full_messages).to include('期限 を入力してください')
      end
    end

    context 'priorityが空' do
      before { params[:priority] = '' }

      it 'エラーになる' do
        expect(form).to be_invalid
        expect(form.errors.full_messages).to include('優先度 を入力してください')
      end
    end

    context 'due_dateが不正' do
      before { params[:due_date] = 'invalid-date' }

      it 'エラーになる' do
        expect(form).to be_invalid
        expect(form.errors[:due_date]).to include('は正しい日付を入力してください')
      end
    end

    context 'due_dateがtask.goalのdue_dateより後の場合' do
      let(:goal) { create(:goal, user: user, due_date: Date.new(2026, 2, 9)) }
      let(:task) { create(:task, user: user, goal: goal) }

      before { params[:due_date] = '2026-02-10' }

      it 'エラーになる' do
        expect(form).to be_invalid
        expect(form.errors[:due_date]).to include('は目標の期限以前にしてください')
      end
    end

    context 'due_dateがtask.goalのdue_dateと同じ日の場合' do
      let(:goal) { create(:goal, user: user, due_date: Date.new(2026, 2, 10)) }
      let(:task) { create(:task, user: user, goal: goal) }

      before { params[:due_date] = '2026-02-10' }

      it '有効である' do
        expect(form).to be_valid
      end
    end

    context 'due_dateがtask.goalのdue_dateより前の場合' do
      let(:goal) { create(:goal, user: user, due_date: Date.new(2026, 2, 11)) }
      let(:task) { create(:task, user: user, goal: goal) }

      before { params[:due_date] = '2026-02-10' }

      it '有効である' do
        expect(form).to be_valid
      end
    end

    context 'task.goalのdue_dateが設定されていない場合' do
      before { params[:due_date] = '2026-02-10' }

      it '有効である' do
        expect(form).to be_valid
      end
    end

    context 'titleが101文字の場合' do
      before { params[:title] = 'あ' * 101 }

      it 'エラーになる' do
        expect(form).to be_invalid
        expect(form.errors[:title]).to include('は100文字以内で入力してください')
      end
    end

    context 'priorityが不正な優先度名の場合' do
      before { params[:priority] = 'urgent' }

      it 'エラーになり、保存時に例外が起きない' do
        expect(form).to be_invalid
        expect(form.errors[:priority]).to be_present
        expect { form.save }.not_to raise_error
      end
    end

    context 'unit_idsに不正なIDが含まれる' do
      before { params[:unit_ids] = [unit1.id, 999_999] }

      it 'エラーになる' do
        expect(form).to be_invalid
        expect(form.errors[:unit_ids]).to be_present
        expect(form.errors.full_messages).to include('単元 に不正な値が含まれています')
      end
    end

    context '学習開始済みの単元を削除した場合' do
      before do
        allow(task).to receive(:started_unit_ids).and_return([unit1.id])
        params[:unit_ids] = [unit2.id]
      end

      it 'エラーになる' do
        expect(form).to be_invalid
        expect(form.errors[:unit_ids]).to include('学習開始済みの単元は削除できません')
      end
    end

    context '学習開始済みの単元を残した場合' do
      before do
        allow(task).to receive(:started_unit_ids).and_return([unit1.id])
        params[:unit_ids] = [unit1.id, unit2.id]
      end

      it '有効である' do
        expect(form).to be_valid
      end
    end
  end

  describe '#parsed_due_date' do
    it 'Dateに変換される' do
      expect(form.parsed_due_date).to eq(Date.parse('2026-12-31'))
    end
  end

  describe '#unit_ids' do
    it 'integer配列に正規化される' do
      params[:unit_ids] = ['', unit1.id.to_s]
      expect(form.unit_ids).to eq([unit1.id])
    end
  end

  describe '#unit_ids_provided' do
    context 'unit_idsが指定されている場合' do
      it 'trueになる' do
        expect(form.unit_ids_provided).to be true
      end
    end

    context 'unit_idsが指定されていない場合' do
      let(:params) do
        {
          title: 'タイトル',
          content: '内容',
          due_date: '2026-12-31',
          priority: '1',
          memo: 'メモ'
        }
      end

      it 'falseになる' do
        expect(form.unit_ids_provided).to be false
      end
    end

    context 'unit_idsがnilの場合' do
      before { params[:unit_ids] = nil }

      it 'falseになる' do
        expect(form.unit_ids_provided).to be false
      end
    end
  end

  describe '#save' do
    let(:service) { instance_double(Student::UpdateTaskService) }

    before do
      allow(Student::UpdateTaskService).to receive(:new).and_return(service)
      allow(service).to receive(:call).and_return(true)
    end

    context 'バリデーション成功時' do
      it 'serviceが呼ばれる' do
        form.save
        expect(service).to have_received(:call)
      end

      it 'trueを返す' do
        expect(form.save).to be true
      end
    end

    context 'バリデーション失敗時' do
      before { params[:title] = '' }

      it 'serviceが呼ばれない' do
        form.save
        expect(service).not_to have_received(:call)
      end

      it 'falseを返す' do
        expect(form.save).to be false
      end
    end

    context 'バリデーション成功したがserviceが失敗した場合' do
      before { allow(service).to receive(:call).and_return(false) }

      it 'falseを返す' do
        expect(form.save).to be false
      end
    end
  end
end
