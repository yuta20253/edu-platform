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

  it '選択した都道府県の高校だけ返却される' do
    result = described_class.new(HighSchool.all).filter_prefecture(prefecture1.id).result

    expect(result).to contain_exactly(high_school1, high_school2, high_school3)
    expect(result).not_to include(high_school4)
  end

  it '高校名で絞り込みができる' do
    result = described_class.new(HighSchool.all).filter_high_school('東').result

    expect(result).to contain_exactly(high_school1, high_school2, high_school5)
    expect(result).not_to include(high_school3, high_school4)
  end
end
