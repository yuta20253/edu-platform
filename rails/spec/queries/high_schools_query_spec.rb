# frozen_string_literal: true

require 'rails_helper'

RSpec.describe HighSchoolsQuery, type: :model do
  let!(:prefecture1) { create(:prefecture, name: '東京都') }
  let!(:prefecture2) { create(:prefecture, name: '神奈川県') }
  let!(:high_school1) { create(:high_school, name: '東京東高校', prefecture: prefecture1) }
  let!(:high_school2) { create(:high_school, name: '東京西高校', prefecture: prefecture1) }
  let!(:high_school3) { create(:high_school, name: '新宿南高校', prefecture: prefecture1) }
  let!(:high_school4) { create(:high_school, name: '神奈川高校', prefecture: prefecture2) }
  let!(:high_school5) { create(:high_school, name: '東神奈川高校', prefecture: prefecture2) }
  let!(:high_school6) { create(:high_school, name: '新宿東高校', prefecture: prefecture1) }
  let!(:high_school7) { create(:high_school, name: '東中野高校', prefecture: prefecture1) }

  it '選択した都道府県の高校だけ返却される' do
    result = described_class.new(HighSchool.all).filter_prefecture(prefecture1.id).result

    expect(result).to contain_exactly(high_school1, high_school2, high_school3, high_school6, high_school7)
    expect(result).not_to include(high_school4)
  end

  it '高校名で絞り込みができる' do
    result = described_class.new(HighSchool.all).filter_high_school('東').result

    expect(result).to contain_exactly(high_school1, high_school2, high_school5, high_school6, high_school7)
    expect(result).not_to include(high_school3, high_school4)
  end

  it '都道府県と高校名の組み合わせで絞り込みできる' do
    result = described_class.new(HighSchool.all).filter_prefecture(prefecture1.id).filter_high_school('東').result

    expect(result).to contain_exactly(high_school1, high_school2, high_school6, high_school7)
    expect(result).not_to include(high_school3, high_school4, high_school5)
  end

  it '条件に一致しない場合は空になる' do
    result = described_class.new(HighSchool.all).filter_prefecture(prefecture1.id).filter_high_school('北').result

    expect(result).to be_empty
  end

  it '高校名の部分一致（前方・中間・後方）ができる' do
    result1 = described_class.new(HighSchool.all).filter_high_school('東京').result
    result2 = described_class.new(HighSchool.all).filter_high_school('宿').result
    result3 = described_class.new(HighSchool.all).filter_high_school('高校').result

    expect(result1).to include(high_school1, high_school2)
    expect(result2).to include(high_school3)
    expect(result3).to include(high_school1, high_school2, high_school3, high_school4, high_school5)
  end
end
