# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::AnalyticsFilterForm, type: :model do
  describe '#valid?' do
    context 'from / to を指定しない場合' do
      subject(:form) { described_class.new }

      it '有効' do
        expect(form).to be_valid
      end
    end

    context 'from / to に正しい日付文字列を指定した場合' do
      subject(:form) { described_class.new(from: '2026-08-01', to: '2026-08-31') }

      it '有効' do
        expect(form).to be_valid
      end
    end

    context 'from が不正な日付文字列の場合' do
      subject(:form) { described_class.new(from: 'invalid-date', to: '2026-08-31') }

      it '無効' do
        expect(form).to be_invalid
      end

      it 'from にエラーが付く' do
        form.valid?
        expect(form.errors[:from]).to be_present
      end
    end

    context 'to が不正な日付文字列の場合' do
      subject(:form) { described_class.new(from: '2026-08-01', to: 'invalid-date') }

      it '無効' do
        expect(form).to be_invalid
      end

      it 'to にエラーが付く' do
        form.valid?
        expect(form.errors[:to]).to be_present
      end
    end

    context 'from が to より後の場合' do
      subject(:form) { described_class.new(from: '2026-08-31', to: '2026-08-01') }

      it '無効' do
        expect(form).to be_invalid
      end

      it 'baseにエラーが付く' do
        form.valid?
        expect(form.errors[:base]).to be_present
      end
    end

    context 'from と to が同じ日付の場合' do
      subject(:form) { described_class.new(from: '2026-08-01', to: '2026-08-01') }

      it '有効(1日間として許可される)' do
        expect(form).to be_valid
      end
    end

    context '期間が366日以内の場合' do
      subject(:form) { described_class.new(from: '2026-01-01', to: '2027-01-01') }

      it '有効' do
        expect(form).to be_valid
      end
    end

    context '期間が366日を超える場合' do
      subject(:form) { described_class.new(from: '2026-01-01', to: '2027-01-02') }

      it '無効' do
        expect(form).to be_invalid
      end

      it 'baseにエラーが付く' do
        form.valid?
        expect(form.errors[:base]).to be_present
      end
    end
  end

  describe '#from_date' do
    context 'from を指定した場合' do
      it '指定した日付を返す' do
        form = described_class.new(from: '2026-08-01')
        expect(form.from_date).to eq(Date.new(2026, 8, 1))
      end
    end

    context 'from を指定しない場合' do
      it '29日前(過去30日間)を返す' do
        travel_to Time.zone.parse('2026-09-11 10:00:00') do
          form = described_class.new
          expect(form.from_date).to eq(Date.new(2026, 8, 13))
        end
      end
    end
  end

  describe '#to_date' do
    context 'to を指定した場合' do
      it '指定した日付を返す' do
        form = described_class.new(to: '2026-08-31')
        expect(form.to_date).to eq(Date.new(2026, 8, 31))
      end
    end

    context 'to を指定しない場合' do
      it '本日を返す' do
        travel_to Time.zone.parse('2026-09-11 10:00:00') do
          form = described_class.new
          expect(form.to_date).to eq(Date.new(2026, 9, 11))
        end
      end
    end
  end

  describe '#high_school_id / #subject_id' do
    it '指定した値を整数として保持する' do
      form = described_class.new(high_school_id: '3', subject_id: '5')
      expect(form.high_school_id).to eq(3)
      expect(form.subject_id).to eq(5)
    end

    it '未指定の場合はnil' do
      form = described_class.new
      expect(form.high_school_id).to be_nil
      expect(form.subject_id).to be_nil
    end
  end
end
