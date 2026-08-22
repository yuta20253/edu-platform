# frozen_string_literal: true

# == Schema Information
#
# Table name: high_schools
#
#  id            :bigint           not null, primary key
#  name          :string(50)       not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  prefecture_id :bigint           not null
#
require 'rails_helper'

RSpec.describe HighSchool, type: :model do
  describe 'バリデーション' do
    it { is_expected.to validate_presence_of(:name) }

    it 'school_codeが重複していると無効' do
      create(:high_school, school_code: 'ABC123')
      high_school = build(:high_school, school_code: 'ABC123')

      expect(high_school).to be_invalid
      expect(high_school.errors[:school_code]).to be_present
    end

    it 'school_codeがnilなら重複チェック対象外(newの時点では有効)' do
      high_school = build(:high_school, school_code: nil)

      expect(high_school).to be_valid
    end
  end

  describe '#generate_school_code (before_create)' do
    it 'school_code未設定なら作成時に自動生成される' do
      high_school = create(:high_school, school_code: nil)

      expect(high_school.school_code).to be_present
    end

    it 'school_codeが既に設定されていれば上書きしない' do
      high_school = create(:high_school, school_code: 'FIXED1')

      expect(high_school.school_code).to eq('FIXED1')
    end

    it '生成されるschool_codeは高校ごとに一意になる' do
      codes = create_list(:high_school, 5).map(&:school_code)

      expect(codes.uniq.size).to eq(5)
    end

    it '生成したコードが既存と衝突する場合は別のコードを再生成する' do
      create(:high_school, school_code: 'AAAAAA')
      allow(SecureRandom).to receive(:alphanumeric).with(6).and_return('aaaaaa', 'bbbbbb')

      new_school = create(:high_school, school_code: nil)

      expect(new_school.school_code).to eq('BBBBBB')
    end
  end
end
