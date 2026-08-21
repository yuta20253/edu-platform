# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::ImportHistoriesQuery, type: :model do
  describe '#call' do
    let!(:unit_a) { create(:unit) }
    let!(:unit_b) { create(:unit) }
    let!(:matched) { create(:import_history, unit: unit_a, status: :completed) }
    let!(:unmatched_status) { create(:import_history, unit: unit_a, status: :failed) }
    let!(:unmatched_unit) { create(:import_history, unit: unit_b, status: :completed) }

    it 'キーワード引数のフィルタを組み合わせて絞り込む' do
      result = described_class.new.call(status: 'completed', unit_id: unit_a.id)
      expect(result).to contain_exactly(matched)
    end

    it '引数を渡さない場合は全件を作成日時降順で返す' do
      result = described_class.new.call
      expect(result).to contain_exactly(matched, unmatched_status, unmatched_unit)
    end

    context 'sort/order を渡す場合' do
      let!(:old) { create(:import_history, created_at: 3.days.ago) }
      let!(:recent) { create(:import_history, created_at: 1.day.ago) }

      it 'その並び順を反映する' do
        result = described_class.new.call(sort: 'created_at', order: 'asc')
        expect(result.to_a.index(old)).to be < result.to_a.index(recent)
      end
    end
  end

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

  describe '#order_by' do
    context 'sort/order を指定しない場合' do
      let!(:old) { create(:import_history, created_at: 3.days.ago) }
      let!(:recent) { create(:import_history, created_at: 1.day.ago) }

      it '作成日時の降順で返す（デフォルト）' do
        expect(described_class.new.order_by(nil, nil).result.to_a).to eq([recent, old])
      end
    end

    context 'sort=created_at, order=asc を指定した場合' do
      let!(:old) { create(:import_history, created_at: 3.days.ago) }
      let!(:recent) { create(:import_history, created_at: 1.day.ago) }

      it '作成日時の昇順で返す' do
        expect(described_class.new.order_by('created_at', 'asc').result.to_a).to eq([old, recent])
      end
    end

    context 'sort=total_count を指定した場合' do
      let!(:small) { create(:import_history, total_count: 1) }
      let!(:large) { create(:import_history, total_count: 10) }

      it '件数の降順で返す' do
        expect(described_class.new.order_by('total_count', 'desc').result.to_a).to eq([large, small])
      end
    end

    context 'sort=success_count を指定した場合' do
      let!(:small) { create(:import_history, success_count: 1) }
      let!(:large) { create(:import_history, success_count: 5) }

      it '成功数の昇順で返す' do
        expect(described_class.new.order_by('success_count', 'asc').result.to_a).to eq([small, large])
      end
    end

    context 'sort=error_count を指定した場合' do
      let!(:small) { create(:import_history, error_count: 0) }
      let!(:large) { create(:import_history, error_count: 3) }

      it 'エラー数の降順で返す' do
        expect(described_class.new.order_by('error_count', 'desc').result.to_a).to eq([large, small])
      end
    end

    context 'sort=status を指定した場合' do
      let!(:completed) { create(:import_history, status: :completed) }
      let!(:failed) { create(:import_history, status: :failed) }

      it 'ステータス（enum内部値）の昇順で返す' do
        expect(described_class.new.order_by('status', 'asc').result.to_a).to eq([completed, failed])
      end
    end

    context '不正な sort 値を指定した場合' do
      let!(:old) { create(:import_history, created_at: 3.days.ago) }
      let!(:recent) { create(:import_history, created_at: 1.day.ago) }

      it 'sort は作成日時にフォールバックしつつ、指定した order は反映される' do
        expect(described_class.new.order_by('invalid_column', 'asc').result.to_a).to eq([old, recent])
      end
    end

    context '不正な order 値を指定した場合' do
      let!(:old) { create(:import_history, created_at: 3.days.ago) }
      let!(:recent) { create(:import_history, created_at: 1.day.ago) }

      it 'デフォルト（降順）にフォールバックする' do
        expect(described_class.new.order_by('created_at', 'invalid_order').result.to_a).to eq([recent, old])
      end
    end
  end
end
