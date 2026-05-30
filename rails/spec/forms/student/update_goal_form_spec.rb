# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::UpdateGoalForm, type: :model do
  describe '#save' do
    let(:user) { create(:user) }
    let(:goal) { create(:goal, user: user, title: '元のタイトル') }

    let(:valid_params) do
      {
        goal: goal,
        title: '英語を頑張る',
        description: '毎日30分',
        due_date: '2026-04-11'
      }
    end

    context '正常系' do
      it '目標が更新されること' do
        form = described_class.new(**valid_params)

        result = form.save

        expect(result).to be true

        goal.reload
        expect(goal.title).to eq '英語を頑張る'
        expect(goal.description).to eq '毎日30分'
        expect(goal.due_date).to eq Date.parse('2026-04-11')
      end
    end

    context 'バリデーションエラー' do
      context 'titleが空の場合' do
        it '保存に失敗し、エラーが追加されること' do
          params = valid_params.merge(title: '')
          form = described_class.new(**params)

          result = form.save

          expect(result).to be false
          expect(form.errors[:title]).to include('を入力してください')
        end
      end

      context 'due_dateが空の場合' do
        it '保存に失敗し、エラーが追加されること' do
          params = valid_params.merge(due_date: '')
          form = described_class.new(**params)

          result = form.save

          expect(result).to be false
          expect(form.errors[:due_date]).to include('を入力してください')
        end
      end

      context 'due_dateが不正な形式の場合' do
        it '保存に失敗し、エラーが追加されること' do
          params = valid_params.merge(due_date: 'invalid-date')
          form = described_class.new(**params)

          result = form.save

          expect(result).to be false
          expect(form.errors[:due_date]).to include('は正しい日付を入力してください')
        end
      end
    end
  end
end
