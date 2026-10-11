# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::AnalyticsPeriodForm, type: :model do
  describe '#valid?' do
    context 'from / to を指定しない場合' do
      subject(:form) { described_class.new }

      it '有効' do
        expect(form).to be_valid
      end
    end

    context 'from / to に正しい日付文字列を指定した場合' do
      subject(:form) { described_class.new(from: '2026-10-05', to: '2026-10-11') }

      it '有効' do
        expect(form).to be_valid
      end
    end

    context 'from が不正な日付文字列の場合' do
      subject(:form) { described_class.new(from: 'invalid-date', to: '2026-10-11') }

      it '無効' do
        expect(form).to be_invalid
      end

      it 'from にエラーが付く' do
        form.valid?
        expect(form.errors[:from]).to include('は正しい日付を入力してください')
      end
    end

    context 'to が不正な日付文字列の場合' do
      subject(:form) { described_class.new(from: '2026-10-05', to: 'invalid-date') }

      it '無効' do
        expect(form).to be_invalid
      end

      it 'to にエラーが付く' do
        form.valid?
        expect(form.errors[:to]).to include('は正しい日付を入力してください')
      end
    end

    context '存在しない日付の場合' do
      subject(:form) { described_class.new(from: '2026-02-30', to: '2026-03-01') }

      it '無効' do
        expect(form).to be_invalid
      end
    end

    context 'from が to より後の場合' do
      subject(:form) { described_class.new(from: '2026-10-11', to: '2026-10-05') }

      it '無効' do
        expect(form).to be_invalid
      end

      it 'to にエラーが付く' do
        form.valid?
        expect(form.errors[:to]).to include('はfrom以降の日付を指定してください')
      end
    end

    context 'from と to が同じ日付の場合' do
      subject(:form) { described_class.new(from: '2026-10-11', to: '2026-10-11') }

      it '有効(1日間として許可される)' do
        expect(form).to be_valid
      end
    end

    context '期間がちょうど366日の場合' do
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
        expect(form.errors[:base]).to include('取得期間は366日以内で指定してください')
      end
    end
  end

  describe '#from_date' do
    context 'from を指定した場合' do
      it '指定した日付を返す' do
        form = described_class.new(from: '2026-10-05')
        expect(form.from_date).to eq(Date.new(2026, 10, 5))
      end
    end

    context 'from を指定しない場合' do
      it '6日前(今日を含む直近7日間の初日)を返す' do
        travel_to Time.zone.parse('2026-09-11 10:00:00') do
          form = described_class.new
          expect(form.from_date).to eq(Date.new(2026, 9, 5))
        end
      end
    end
  end

  describe '#to_date' do
    context 'to を指定した場合' do
      it '指定した日付を返す' do
        form = described_class.new(to: '2026-10-11')
        expect(form.to_date).to eq(Date.new(2026, 10, 11))
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
end
