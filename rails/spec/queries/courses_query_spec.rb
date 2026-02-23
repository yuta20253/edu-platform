# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CoursesQuery, type: :model do
  let!(:user) { create(:user) }
  let!(:subject1) { create(:subject, name: '英語') }
  let!(:subject2) { create(:subject, name: '数学') }

  let!(:course1) { create(:course, subject: subject1) }
  let!(:course2) { create(:course, subject: subject2) }

  let!(:unit1) { create(:unit, course: course1) }
  let!(:unit2) { create(:unit, course: course1) }
  let!(:unit3) { create(:unit, course: course2) }

  it '選ばれた教科の講座だけ返却される' do
    result = described_class.new.join_subject.by_subject('英語').result

    expect(result).to contain_exactly(course1)
  end

  it '紐づく単元が返却される' do
    result = described_class.new.join_subject.includes_units.result

    expect(result.find(course1.id).units).to contain_exactly(unit1, unit2)
  end
end
