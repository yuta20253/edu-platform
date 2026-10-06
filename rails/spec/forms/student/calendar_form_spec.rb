# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::CalendarForm, type: :model do
  subject(:form) { described_class.new(**params) }

  let(:params) { { from: '2026-02-01', to: '2026-02-28' } }

  it '有効であること' do
    expect(form).to be_valid
  end

  describe 'from' do
    context '未指定の場合' do
      let(:params) { { from: nil, to: '2026-02-28' } }

      it '無効になる' do
        expect(form).not_to be_valid
        expect(form.errors[:from]).to be_present
      end
    end

    context '日付としてパースできない場合' do
      let(:params) { { from: '2026-02-99', to: '2026-02-28' } }

      it '無効になる' do
        expect(form).not_to be_valid
        expect(form.errors[:from]).to include('は正しい日付を入力してください')
      end
    end

    context 'YYYY-MM-DD以外の形式の場合' do
      let(:params) { { from: '2026/02/01', to: '2026-02-28' } }

      it '無効になる' do
        expect(form).not_to be_valid
        expect(form.errors[:from]).to include('は正しい日付を入力してください')
      end
    end
  end

  describe 'to' do
    context '未指定の場合' do
      let(:params) { { from: '2026-02-01', to: nil } }

      it '無効になる' do
        expect(form).not_to be_valid
        expect(form.errors[:to]).to be_present
      end
    end

    context '日付としてパースできない場合' do
      let(:params) { { from: '2026-02-01', to: '2026-02-99' } }

      it '無効になる' do
        expect(form).not_to be_valid
        expect(form.errors[:to]).to include('は正しい日付を入力してください')
      end
    end

    context 'fromより前の日付の場合' do
      let(:params) { { from: '2026-02-10', to: '2026-02-01' } }

      it '無効になる' do
        expect(form).not_to be_valid
        expect(form.errors[:to]).to include('はfrom以降の日付を指定してください')
      end
    end
  end

  describe '期間の上限' do
    context 'ちょうど92日の場合' do
      let(:params) { { from: '2026-01-01', to: '2026-04-02' } }

      it '有効であること' do
        expect(form).to be_valid
      end
    end

    context '92日を超える場合' do
      let(:params) { { from: '2026-01-01', to: '2026-04-03' } }

      it '無効になる' do
        expect(form).not_to be_valid
        expect(form.errors[:base]).to include('取得期間は92日以内で指定してください')
      end
    end
  end

  describe '#from_date / #to_date' do
    it 'パース済みのDateオブジェクトを返す' do
      form.valid?

      expect(form.from_date).to eq(Date.new(2026, 2, 1))
      expect(form.to_date).to eq(Date.new(2026, 2, 28))
    end
  end
end
