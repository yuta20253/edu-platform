# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::ImportHistoryCsvExporterService, type: :model do
  subject(:csv) { described_class.new(history).call }

  let(:high_school) { create(:high_school) }
  let(:teacher) { create(:user, :teacher, high_school: high_school) }
  let(:grade) { create(:grade, high_school: high_school, year: 1) }
  let(:school_class) { create(:school_class, grade: grade, name: 'A組') }
  let(:history) { create(:import_history, user: teacher, unit: nil, import_type: :student, status: :completed) }

  context '成功行が存在する場合' do
    before do
      student = create(:user, :student, high_school: high_school, grade: grade, school_class: school_class,
                                        name: '山田太郎', name_kana: 'ヤマダタロウ', student_number: 'TST-ABC123',
                                        email: 'taro@sensitive-example.test')
      ImportedStudent.create!(import_history: history, user: student, action: :created)
    end

    it 'BOM付きで始まる' do
      expect(csv).to start_with('﻿')
    end

    it 'ヘッダー行に氏名・氏名カナ・学年・学級・生徒コードを含む' do
      rows = CSV.parse(csv.delete_prefix('﻿'))
      expect(rows.first).to eq(%w[氏名 氏名カナ 学年 学級 生徒コード])
    end

    it '生徒の氏名・氏名カナ・学年・学級・生徒コードが出力される' do
      rows = CSV.parse(csv.delete_prefix('﻿'), headers: true)
      expect(rows.first.to_h).to eq(
        '氏名' => '山田太郎',
        '氏名カナ' => 'ヤマダタロウ',
        '学年' => '高１生',
        '学級' => 'A組',
        '生徒コード' => 'TST-ABC123'
      )
    end

    it 'メールアドレスは含まれない' do
      rows = CSV.parse(csv.delete_prefix('﻿'))
      expect(rows.first).not_to include('メール')
      expect(csv).not_to include('taro@sensitive-example.test')
    end
  end

  context '氏名が数式インジェクションを狙った値で始まる場合' do
    before do
      student = create(:user, :student, high_school: high_school, grade: grade, school_class: school_class,
                                        name: '=cmd|calc', name_kana: '+HYPERLINK', student_number: 'TST-XYZ789')
      ImportedStudent.create!(import_history: history, user: student, action: :updated)
    end

    it '先頭にシングルクォートを付与してエスケープする' do
      rows = CSV.parse(csv.delete_prefix('﻿'), headers: true)
      expect(rows.first['氏名']).to eq("'=cmd|calc")
      expect(rows.first['氏名カナ']).to eq("'+HYPERLINK")
    end
  end

  context '成功行が存在しない場合' do
    it 'ヘッダー行のみで生徒の行は出力されない' do
      rows = CSV.parse(csv.delete_prefix('﻿'), headers: true)
      expect(rows.size).to eq(0)
    end
  end
end
