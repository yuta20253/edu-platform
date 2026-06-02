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

  describe '#search' do
    let!(:subject_record) { create(:subject) }
    let!(:c1) { create(:course, subject: subject_record, level_name: '基礎英語', description: '入門') }
    let!(:c2) { create(:course, subject: subject_record, level_name: '応用', description: '基礎を踏まえた応用') }
    let!(:c3) { create(:course, subject: subject_record, level_name: '上級', description: '上級向け') }

    it 'level_name に部分一致する course を返す' do
      expect(described_class.new.search('英語').result).to contain_exactly(c1)
    end

    it 'description に部分一致する course を返す（level_name は一致しない）' do
      expect(described_class.new.search('応用').result).to contain_exactly(c2)
    end

    it 'level_name OR description のいずれかに一致' do
      expect(described_class.new.search('基礎').result).to contain_exactly(c1, c2)
    end

    it 'nil の場合はフィルタしない' do
      expect(described_class.new.search(nil).result).to contain_exactly(c1, c2, c3)
    end

    it '空文字の場合はフィルタしない' do
      expect(described_class.new.search('').result).to contain_exactly(c1, c2, c3)
    end

    it 'LIKE 特殊文字 % をリテラル文字として扱う' do
      special = create(:course, subject: subject_record, level_name: '100%達成')
      expect(described_class.new.search('%達成').result).to contain_exactly(special)
    end
  end
end
