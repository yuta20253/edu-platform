# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::ImportHistoriesQuery, type: :model do
  describe '#result' do
    it 'user / unit / unit.course を preload するように relation に includes を指定する' do
      relation = described_class.new.result
      expect(relation.includes_values).to include(:user, unit: :course)
    end
  end

  describe '#by_status' do
    let!(:completed) { create(:import_history, status: :completed) }
    let!(:failed) { create(:import_history, status: :failed) }

    it '指定した status のみ返す' do
      expect(described_class.new.by_status('failed').result).to contain_exactly(failed)
    end

    it 'nil の場合はフィルタしない' do
      expect(described_class.new.by_status(nil).result).to contain_exactly(completed, failed)
    end

    it '空文字の場合はフィルタしない' do
      expect(described_class.new.by_status('').result).to contain_exactly(completed, failed)
    end

    it '不正な status 値の場合はフィルタしない（500にならない）' do
      expect(described_class.new.by_status('invalid').result).to contain_exactly(completed, failed)
    end

    it '配列を渡してもフィルタしない（パラメータ汚染防止）' do
      expect(described_class.new.by_status(%w[failed]).result).to contain_exactly(completed, failed)
    end
  end

  describe '#by_unit_id' do
    let!(:unit_a) { create(:unit) }
    let!(:unit_b) { create(:unit) }
    let!(:history_a) { create(:import_history, unit: unit_a) }
    let!(:history_b) { create(:import_history, unit: unit_b) }

    it '指定 unit_id の履歴のみ返す' do
      expect(described_class.new.by_unit_id(unit_a.id).result).to contain_exactly(history_a)
    end

    it 'nil の場合はフィルタしない' do
      expect(described_class.new.by_unit_id(nil).result).to contain_exactly(history_a, history_b)
    end

    it '配列を渡してもフィルタしない（パラメータ汚染防止）' do
      expect(described_class.new.by_unit_id([unit_a.id, unit_b.id]).result)
        .to contain_exactly(history_a, history_b)
    end

    it 'ハッシュを渡してもフィルタしない（パラメータ汚染防止）' do
      expect(described_class.new.by_unit_id({ gt: 0 }).result).to contain_exactly(history_a, history_b)
    end
  end

  describe '#by_course_id' do
    let!(:course_a) { create(:course) }
    let!(:course_b) { create(:course) }
    let!(:unit_a) { create(:unit, course: course_a) }
    let!(:unit_b) { create(:unit, course: course_b) }
    let!(:history_a) { create(:import_history, unit: unit_a) }
    let!(:history_b) { create(:import_history, unit: unit_b) }

    it '指定 course_id に属する unit の履歴のみ返す（unit 経由の join）' do
      expect(described_class.new.by_course_id(course_a.id).result).to contain_exactly(history_a)
    end

    it 'nil の場合はフィルタしない' do
      expect(described_class.new.by_course_id(nil).result).to contain_exactly(history_a, history_b)
    end

    it '配列を渡してもフィルタしない（パラメータ汚染防止）' do
      expect(described_class.new.by_course_id([course_a.id, course_b.id]).result)
        .to contain_exactly(history_a, history_b)
    end
  end

  describe '#by_user_id' do
    let!(:user_a) { create(:user, :admin, high_school: nil) }
    let!(:user_b) { create(:user, :admin, high_school: nil) }
    let!(:history_a) { create(:import_history, user: user_a) }
    let!(:history_b) { create(:import_history, user: user_b) }

    it '指定 user_id (実行者) の履歴のみ返す' do
      expect(described_class.new.by_user_id(user_a.id).result).to contain_exactly(history_a)
    end

    it 'nil の場合はフィルタしない' do
      expect(described_class.new.by_user_id(nil).result).to contain_exactly(history_a, history_b)
    end
  end

  describe '#by_period' do
    let!(:old) { create(:import_history, created_at: 10.days.ago) }
    let!(:mid) { create(:import_history, created_at: 5.days.ago) }
    let!(:recent) { create(:import_history, created_at: 1.day.ago) }

    it 'from のみ指定した場合、from 以降の履歴を返す' do
      expect(described_class.new.by_period(6.days.ago.to_date.to_s, nil).result)
        .to contain_exactly(mid, recent)
    end

    it 'to のみ指定した場合、to 以前の履歴を返す' do
      expect(described_class.new.by_period(nil, 6.days.ago.to_date.to_s).result)
        .to contain_exactly(old)
    end

    it 'from と to を両方指定した場合、範囲内の履歴を返す' do
      expect(described_class.new.by_period(6.days.ago.to_date.to_s, 2.days.ago.to_date.to_s).result)
        .to contain_exactly(mid)
    end

    it '両方 nil の場合はフィルタしない' do
      expect(described_class.new.by_period(nil, nil).result).to contain_exactly(old, mid, recent)
    end

    it '不正な日付文字列はフィルタしない（500にならない）' do
      expect(described_class.new.by_period('invalid-date', nil).result)
        .to contain_exactly(old, mid, recent)
    end
  end

  describe '#order_by_created_at_desc' do
    let!(:old) { create(:import_history, created_at: 3.days.ago) }
    let!(:recent) { create(:import_history, created_at: 1.day.ago) }

    it '作成日時の降順で返す' do
      expect(described_class.new.order_by_created_at_desc.result.to_a).to eq([recent, old])
    end
  end
end
