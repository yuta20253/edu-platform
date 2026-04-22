# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AddressesQuery, type: :model do
  let!(:tokyo) { create(:prefecture, id: 1, name: '東京都') }
  let!(:osaka) { create(:prefecture, id: 2, name: '大阪府') }

  let!(:shinjuku_address) do
    create(
      :address,
      prefecture: tokyo,
      city: '新宿',
      town: '西新宿'
    )
  end

  let!(:shibuya_address) do
    create(
      :address,
      prefecture: tokyo,
      city: '渋谷',
      town: '道玄坂'
    )
  end

  # 大阪の住所
  let!(:umeda_address) do
    create(
      :address,
      prefecture: osaka,
      city: '北区',
      town: '梅田'
    )
  end

  describe '#call' do
    context '都道府県IDのみ指定した場合' do
      it '該当都道府県の住所のみ返す' do
        result = described_class.new(
          prefecture_id: tokyo.id,
          city: nil,
          town: nil
        ).call

        expect(result).to contain_exactly(
          shinjuku_address,
          shibuya_address
        )
      end
    end

    context '市区町村で部分一致検索した場合' do
      it '一致する市区町村の住所を返す' do
        result = described_class.new(
          prefecture_id: nil,
          city: '新',
          town: nil
        ).call

        expect(result).to contain_exactly(shinjuku_address)
      end
    end

    context '町名で部分一致検索した場合' do
      it '一致する町名の住所を返す' do
        result = described_class.new(
          prefecture_id: nil,
          city: nil,
          town: '梅'
        ).call

        expect(result).to contain_exactly(umeda_address)
      end
    end

    context '複数条件を組み合わせた場合' do
      it 'すべての条件に一致する住所を返す' do
        result = described_class.new(
          prefecture_id: tokyo.id,
          city: '渋',
          town: '道玄'
        ).call

        expect(result).to contain_exactly(shibuya_address)
      end
    end

    context '条件なしの場合' do
      it 'すべての住所を返す' do
        result = described_class.new(
          prefecture_id: nil,
          city: nil,
          town: nil
        ).call

        expect(result).to contain_exactly(
          shinjuku_address,
          shibuya_address,
          umeda_address
        )
      end
    end

    context '空文字が渡された場合' do
      it '空文字は無視されて全件対象になる' do
        result = described_class.new(
          prefecture_id: tokyo.id,
          city: '',
          town: ''
        ).call

        expect(result).to contain_exactly(
          shinjuku_address,
          shibuya_address
        )
      end
    end

    context '存在しない条件を指定した場合' do
      it '該当なしで空配列を返す' do
        result = described_class.new(
          prefecture_id: 999,
          city: '存在しない',
          town: '存在しない'
        ).call

        expect(result).to be_empty
      end
    end

    context '完全一致の場合' do
      it '正確に一致するレコードのみ返す' do
        result = described_class.new(
          prefecture_id: tokyo.id,
          city: '新宿',
          town: '西新宿'
        ).call

        expect(result).to contain_exactly(shinjuku_address)
      end
    end

    context '部分一致で複数ヒットする場合' do
      it '複数件返す' do
        result = described_class.new(
          prefecture_id: tokyo.id,
          city: '新',
          town: nil
        ).call

        expect(result).to contain_exactly(shinjuku_address)
      end
    end
  end
end
