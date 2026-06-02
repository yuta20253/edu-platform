# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::CoursesQuery, type: :model do
  describe '#by_subject_id' do
    let!(:subject_a) { create(:subject, name: '英語') }
    let!(:subject_b) { create(:subject, name: '数学') }
    let!(:course_a) { create(:course, subject: subject_a) }
    let!(:course_b) { create(:course, subject: subject_b) }

    it '指定 subject_id の course のみ返す' do
      expect(described_class.new.by_subject_id(subject_a.id).result).to contain_exactly(course_a)
    end

    it 'nil の場合はフィルタしない' do
      expect(described_class.new.by_subject_id(nil).result).to contain_exactly(course_a, course_b)
    end

    it '空文字の場合はフィルタしない' do
      expect(described_class.new.by_subject_id('').result).to contain_exactly(course_a, course_b)
    end
  end
end
