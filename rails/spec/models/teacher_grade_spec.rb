# frozen_string_literal: true

# == Schema Information
#
# Table name: teacher_grades
#
#  id         :bigint           not null, primary key
#  user_id    :bigint           not null
#  grade_id   :bigint           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
require 'rails_helper'

RSpec.describe TeacherGrade, type: :model do
  it 'teacherなら有効' do
    teacher = create(:user, :teacher)
    grade = create(:grade)

    teacher_grade = build(:teacher_grade, user: teacher, grade: grade)

    expect(teacher_grade).to be_valid
  end

  it 'teacher以外なら無効' do
    admin = create(:user, :admin)
    grade = create(:grade)

    teacher_grade = build(:teacher_grade, user: admin, grade: grade)

    expect(teacher_grade).to be_invalid

    expect(teacher_grade.errors[:user]).to include('教職員アカウントのみ設定可能です')
  end

  it 'gradeがないと無効' do
    teacher = create(:user, :teacher)

    tg = build(:teacher_grade, user: teacher, grade: nil)

    expect(tg).to be_invalid
  end

  it 'user削除でteacher_gradeも削除される' do
    teacher = create(:user, :teacher)
    grade = create(:grade)
    create(:teacher_grade, user: teacher, grade: grade)

    expect { teacher.destroy }.to change(described_class, :count).by(-1)
  end
end
