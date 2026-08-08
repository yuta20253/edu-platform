# frozen_string_literal: true

# == Schema Information
#
# Table name: teacher_school_classes
#
#  id              :bigint           not null, primary key
#  user_id         :bigint           not null
#  school_class_id :bigint           not null
#  role            :integer          not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#
require 'rails_helper'

RSpec.describe TeacherSchoolClass, type: :model do
  describe 'validations' do
    subject(:teacher_school_class) { build(:teacher_school_class) }

    it '有効な属性であれば有効であること' do
      expect(teacher_school_class).to be_valid
    end

    it 'teacher以外のユーザーは登録できないこと' do
      student = create(:user, :student)

      teacher_school_class = build(
        :teacher_school_class,
        user: student
      )

      expect(teacher_school_class).to be_invalid
      expect(teacher_school_class.errors[:user]).to be_present
    end

    it '同じユーザーを同じ学級に重複登録できないこと' do
      existing = create(:teacher_school_class)

      duplicate = build(
        :teacher_school_class,
        user: existing.user,
        school_class: existing.school_class
      )

      expect(duplicate).to be_invalid
      expect(duplicate.errors[:user_id]).to be_present
    end
  end
end
