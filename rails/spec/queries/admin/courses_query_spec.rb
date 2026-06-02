# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::CoursesQuery, type: :model do
  describe '#active' do
    let!(:subject_record) { create(:subject) }
    let!(:alive) { create(:course, subject: subject_record) }
    let!(:dead)  { create(:course, subject: subject_record, deleted_at: Time.current) }

    it 'deleted_at が NULL の course だけ返す' do
      expect(described_class.new.active.result).to contain_exactly(alive)
    end
  end

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

  describe '#order_by' do
    let!(:subject_record) { create(:subject) }
    let!(:c_old) { create(:course, subject: subject_record, level_name: 'A', created_at: 3.days.ago) }
    let!(:c_mid) { create(:course, subject: subject_record, level_name: 'C', created_at: 2.days.ago) }
    let!(:c_new) { create(:course, subject: subject_record, level_name: 'B', created_at: 1.day.ago) }

    it 'デフォルトは created_at desc' do
      expect(described_class.new.order_by(nil, nil).result.to_a).to eq([c_new, c_mid, c_old])
    end

    it 'level_name asc を許可' do
      expect(described_class.new.order_by('level_name', 'asc').result.to_a).to eq([c_old, c_new, c_mid])
    end

    it 'id asc を許可' do
      expect(described_class.new.order_by('id', 'asc').result.to_a).to eq([c_old, c_mid, c_new])
    end

    it 'sort のホワイトリスト外は既定値 created_at にフォールバック（order は渡された値を尊重）' do
      # sort=subject_id（ホワイトリスト外）→ created_at に。order=asc は有効なので created_at asc
      expect(described_class.new.order_by('subject_id', 'asc').result.to_a).to eq([c_old, c_mid, c_new])
    end

    it 'order のホワイトリスト外は既定値にフォールバック' do
      expect(described_class.new.order_by('level_name', 'foo').result.to_a).to eq([c_mid, c_new, c_old])
    end
  end
end
