# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::TeachersQuery, type: :model do
  let!(:high_school1) { create(:high_school, name: 'A高校') }
  let!(:high_school2) { create(:high_school, name: 'B高校') }
  let!(:grade1) { create(:grade, high_school: high_school1) }
  let!(:grade2) { create(:grade, high_school: high_school1) }
  let!(:grade3) { create(:grade, high_school: high_school2) }
  let!(:student_role) { create(:user_role, name: :student) }
  let!(:teacher_role) { create(:user_role, name: :teacher) }

  let!(:student1) { create(:user, user_role: student_role, grade: grade1, high_school: high_school1) }
  let!(:student2) { create(:user, user_role: student_role, grade: grade2, high_school: high_school1) }
  let!(:student3) { create(:user, user_role: student_role, grade: grade3, high_school: high_school2) }
  let!(:teacher1) { create(:user, user_role: teacher_role, grade: grade1, high_school: high_school1) }
  let!(:teacher2) { create(:user, user_role: teacher_role, grade: grade3, high_school: high_school2) }
  let!(:teacher3) { create(:user, user_role: teacher_role, grade: grade2, high_school: high_school1) }

  it '同じ高校のteacherのみ返す' do
    result = described_class.new(teacher1.high_school.users).colleagues.result
    expect(result).to contain_exactly(teacher1, teacher3)
    expect(result).not_to include(teacher2, student1, student2, student3)
  end
end
