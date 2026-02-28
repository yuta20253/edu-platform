# == Schema Information
#
# Table name: grades
#
#  id             :bigint           not null, primary key
#  high_school_id :bigint           not null
#  year           :integer          not null
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#
require 'rails_helper'

RSpec.describe Grade, type: :model do
  describe 'バリデーション' do
    it { is_expected.to validate_presence_of(:year) }
  end

  it "同じ高校内でyearは一意" do
    high_school = create(:high_school)

    create(:grade, high_school: high_school, year: 1)

    duplicate = build(:grade, high_school: high_school, year: 1)

    expect(duplicate).to be_invalid
  end

  it "高校が違えば同じyearでも有効" do
    hs1 = create(:high_school)
    hs2 = create(:high_school)

    create(:grade, high_school: hs1, year: 1)

    other = build(:grade, high_school: hs2, year: 1)

    expect(other).to be_valid
  end

  it "grade削除でteacher_gradesも削除される" do
    grade = create(:grade)
    teacher = create(:user, :teacher)
    create(:teacher_grade, grade: grade, user: teacher)

    expect { grade.destroy }.to change { TeacherGrade.count }.by(-1)
  end
end
