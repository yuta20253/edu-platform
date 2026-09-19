# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::ImportHistoriesQuery, type: :model do
  let!(:teacher) { create(:user, :teacher, high_school: create(:high_school)) }
  let!(:other_teacher) { create(:user, :teacher, high_school: create(:high_school)) }

  describe '#call' do
    let!(:mine) { create(:import_history, user: teacher, unit: nil, import_type: :student) }
    let!(:others) { create(:import_history, user: other_teacher, unit: nil, import_type: :student) }
    let!(:question_import) { create(:import_history, user: teacher, import_type: :question) }

    it '自分が実行した生徒インポートのみ返す' do
      result = described_class.new(teacher).call
      expect(result).to contain_exactly(mine)
    end

    it '他の教員が実行した履歴は含まれない' do
      result = described_class.new(teacher).call
      expect(result).not_to include(others)
    end

    it '生徒インポート以外(問題インポート)は含まれない' do
      result = described_class.new(teacher).call
      expect(result).not_to include(question_import)
    end

    context 'status を指定する場合' do
      let!(:completed) { create(:import_history, user: teacher, unit: nil, import_type: :student, status: :completed) }
      let!(:failed) { create(:import_history, user: teacher, unit: nil, import_type: :student, status: :failed) }

      it '指定した status のみ返す' do
        result = described_class.new(teacher).call(status: 'failed')
        expect(result).to contain_exactly(failed)
      end

      it '不正な status 値の場合はフィルタしない（500にならない）' do
        result = described_class.new(teacher).call(status: 'invalid')
        expect(result).to include(completed, failed)
      end
    end

    context 'from/to を指定する場合' do
      let!(:old) { create(:import_history, user: teacher, unit: nil, import_type: :student, created_at: 10.days.ago) }
      let!(:recent) { create(:import_history, user: teacher, unit: nil, import_type: :student, created_at: 1.day.ago) }

      it 'from 以降の履歴のみ返す' do
        result = described_class.new(teacher).call(from: 6.days.ago.to_date.to_s)
        expect(result).to include(recent)
        expect(result).not_to include(old)
      end

      it 'to 以前の履歴のみ返す' do
        result = described_class.new(teacher).call(to: 6.days.ago.to_date.to_s)
        expect(result).to include(old)
        expect(result).not_to include(recent)
      end
    end

    context 'sort/order を指定する場合' do
      let!(:old) { create(:import_history, user: teacher, unit: nil, import_type: :student, created_at: 3.days.ago) }
      let!(:recent) { create(:import_history, user: teacher, unit: nil, import_type: :student, created_at: 1.day.ago) }

      it '昇順で返せる' do
        result = described_class.new(teacher).call(sort: 'created_at', order: 'asc')
        expect(result.to_a.index(old)).to be < result.to_a.index(recent)
      end
    end

    it '何も指定しない場合は作成日時の降順で返す（デフォルト）' do
      old = create(:import_history, user: teacher, unit: nil, import_type: :student, created_at: 3.days.ago)
      recent = create(:import_history, user: teacher, unit: nil, import_type: :student, created_at: 1.day.ago)

      result = described_class.new(teacher).call
      expect(result.to_a.index(recent)).to be < result.to_a.index(old)
    end
  end
end
