# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::CreateGoalForm, type: :model do
  subject { described_class.new(**params) }

  let(:user) { create(:user) }

  let(:params) do
    {
      current_user: user,
      title: '英語を頑張る',
      description: '毎日30分',
      due_date: '2026-04-11'
    }
  end

  describe '#save' do
    context '入力が正しい時' do
      it 'Goalが作成される' do
        expect { subject.save }.to change(Goal, :count).by(1)
      end

      it 'current_userに紐づいたGoalが作成される' do
        subject.save
        expect(subject.goal.user).to eq(user)
      end

      it 'goalをattr_readerで取得できる' do
        subject.save
        expect(subject.goal).to be_a(Goal)
      end

      it 'due_dateがDate型で保存される' do
        subject.save
        expect(subject.goal.due_date).to eq(Date.new(2026, 4, 11))
      end
    end

    context 'titleがない時' do
      it '保存されない' do
        params[:title] = nil
        form = described_class.new(**params)

        expect(form.save).to be_nil
        expect(form.errors[:title]).to be_present
      end
    end

    context 'due_dateが不正な値の時' do
      it 'エラーになる' do
        params[:due_date] = 'invalid-date'
        form = described_class.new(**params)

        expect(form.save).to be_nil
        expect(form.errors[:due_date]).to include('は正しい日付を入力してください')
      end
    end

    context 'バリデーションエラーがあるとき' do
      it 'Goalは作成されない' do
        params[:title] = nil
        form = described_class.new(**params)

        expect { form.save }.not_to change(Goal, :count)
      end
    end
  end
end
