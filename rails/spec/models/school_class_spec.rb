# frozen_string_literal: true

# == Schema Information
#
# Table name: school_classes
#
#  id         :bigint           not null, primary key
#  grade_id   :bigint           not null
#  name       :string(255)      not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
require 'rails_helper'

RSpec.describe SchoolClass, type: :model do
  describe '.model_name.human' do
    it 'モデル名が日本語になる' do
      expect(described_class.model_name.human).to eq('学級')
    end
  end

  describe 'バリデーション' do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_length_of(:name).is_at_most(255) }
  end

  describe '削除' do
    it '生徒が存在する場合は削除できない' do
      grade = create(:grade)
      school_class = create(:school_class, grade: grade)

      create(
        :user,
        :student,
        grade: grade,
        school_class: school_class
      )

      expect { school_class.destroy }.not_to change(described_class, :count)
    end
  end
end
