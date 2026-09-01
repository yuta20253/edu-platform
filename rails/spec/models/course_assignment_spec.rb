# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CourseAssignment, type: :model do
  it '高校とコースが揃っていれば有効' do
    assignment = build(:course_assignment)
    expect(assignment).to be_valid
  end

  it 'high_schoolがないと無効' do
    assignment = build(:course_assignment, high_school: nil)
    expect(assignment).to be_invalid
  end

  it 'courseがないと無効' do
    assignment = build(:course_assignment, course: nil)
    expect(assignment).to be_invalid
  end

  it '同じ高校に同じコースを重複割当すると無効' do
    existing = create(:course_assignment)

    duplicate = build(:course_assignment, high_school: existing.high_school, course: existing.course)

    expect(duplicate).to be_invalid
    expect(duplicate.errors[:course_id]).to be_present
  end

  it '高校削除で割当も削除される' do
    assignment = create(:course_assignment)

    expect { assignment.high_school.destroy }.to change(described_class, :count).by(-1)
  end

  it 'コース削除で割当も削除される' do
    assignment = create(:course_assignment)

    expect { assignment.course.destroy }.to change(described_class, :count).by(-1)
  end
end
