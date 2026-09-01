# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::StudentCsvDryRunService, type: :service do
  let(:high_school) { create(:high_school) }
  let(:grade) { create(:grade, high_school: high_school, year: 1) }

  let(:file) do
    Tempfile.new(['students', '.csv']).tap do |f|
      f.write(csv_content)
      f.rewind
    end
  end

  after { file.close! }

  describe '#call' do
    context '正常系' do
      let!(:school_class) { create(:school_class, grade: grade, name: 'A組') }
      let(:csv_content) do
        <<~CSV
          氏名,氏名カナ,メール,学年,学級
          山田太郎,ヤマダタロウ,taro@example.com,#{Grade::DISPLAY_NAMES[1]},A組
        CSV
      end

      it 'total_countとvalid_countが一致しrowsが空になる' do
        result = described_class.new(file, high_school: high_school).call

        expect(result).to eq(total_count: 1, valid_count: 1, rows: [])
      end
    end

    context '他校の生徒が混在するCSVの場合' do
      let(:other_high_school) { create(:high_school) }
      let(:other_grade) { create(:grade, high_school: other_high_school, year: 1) }
      let!(:school_class) { create(:school_class, grade: other_grade, name: 'A組') }

      let(:csv_content) do
        <<~CSV
          氏名,氏名カナ,メール,学年,学級
          山田太郎,ヤマダタロウ,taro@example.com,#{Grade::DISPLAY_NAMES[1]},A組
        CSV
      end

      it '実行教員の所属高校に存在しない学年・学級として無効になる' do
        result = described_class.new(file, high_school: high_school).call

        expect(result[:valid_count]).to eq(0)
        expect(result[:rows].size).to eq(1)
        expect(result[:rows].first[:message]).to include('学年')
      end
    end

    context 'CSV内でメールアドレスが重複している場合' do
      let!(:school_class) { create(:school_class, grade: grade, name: 'A組') }
      let(:csv_content) do
        <<~CSV
          氏名,氏名カナ,メール,学年,学級
          山田太郎,ヤマダタロウ,dup@example.com,#{Grade::DISPLAY_NAMES[1]},A組
          鈴木花子,スズキハナコ,dup@example.com,#{Grade::DISPLAY_NAMES[1]},A組
        CSV
      end

      it '両方の行がCSV内重複として無効になる' do
        result = described_class.new(file, high_school: high_school).call

        expect(result[:valid_count]).to eq(0)
        expect(result[:rows].size).to eq(2)
        expect(result[:rows].pluck(:message)).to all(include('重複'))
      end
    end

    context '他校の既存Userとメールアドレスが一致する場合' do
      let!(:school_class) { create(:school_class, grade: grade, name: 'A組') }
      let(:other_high_school) { create(:high_school) }
      let!(:other_school_user) do
        create(:user, :student, email: 'other@example.com', high_school: other_high_school,
                                grade: create(:grade, high_school: other_high_school))
      end
      let(:csv_content) do
        <<~CSV
          氏名,氏名カナ,メール,学年,学級
          山田太郎,ヤマダタロウ,other@example.com,#{Grade::DISPLAY_NAMES[1]},A組
        CSV
      end

      it '他校のアカウントとして無効になる' do
        result = described_class.new(file, high_school: high_school).call

        expect(result[:valid_count]).to eq(0)
        expect(result[:rows].first[:message]).to include('他の高校')
      end
    end

    context '自校の既存Userとメールアドレスが一致する場合' do
      let!(:school_class) { create(:school_class, grade: grade, name: 'A組') }
      let!(:same_school_user) do
        create(:user, :student, email: 'taro@example.com', high_school: high_school, grade: grade)
      end
      let(:csv_content) do
        <<~CSV
          氏名,氏名カナ,メール,学年,学級
          山田太郎,ヤマダタロウ,taro@example.com,#{Grade::DISPLAY_NAMES[1]},A組
        CSV
      end

      it '更新対象として有効になる' do
        result = described_class.new(file, high_school: high_school).call

        expect(result).to eq(total_count: 1, valid_count: 1, rows: [])
      end
    end

    context 'DBへの影響' do
      let!(:school_class) { create(:school_class, grade: grade, name: 'A組') }
      let(:csv_content) do
        <<~CSV
          氏名,氏名カナ,メール,学年,学級
          山田太郎,ヤマダタロウ,taro@example.com,#{Grade::DISPLAY_NAMES[1]},A組
        CSV
      end

      it 'Userが作成されない' do
        expect { described_class.new(file, high_school: high_school).call }.not_to change(User, :count)
      end

      it 'ImportHistoryが作成されない' do
        expect { described_class.new(file, high_school: high_school).call }.not_to change(ImportHistory, :count)
      end

      it 'ImportErrorが作成されない' do
        expect { described_class.new(file, high_school: high_school).call }.not_to change(ImportError, :count)
      end
    end
  end

  # dry runの判定(valid_count)が、本実行(Teacher::StudentCsvBatchImportService)の結果と
  # 食い違っていないことを、実際に両方動かして確認する。
  describe '本実行との整合性' do
    let!(:student_role) { create(:user_role, :student) }
    let!(:school_class) { create(:school_class, grade: grade, name: 'A組') }
    let(:teacher) { create(:user, :teacher, high_school: high_school) }

    let(:other_high_school) { create(:high_school) }
    let!(:other_school_user) do
      create(:user, :student, email: 'taken@example.com', high_school: other_high_school,
                              grade: create(:grade, high_school: other_high_school))
    end

    let(:csv_content) do
      <<~CSV
        氏名,氏名カナ,メール,学年,学級
        山田太郎,ヤマダタロウ,taro@example.com,#{Grade::DISPLAY_NAMES[1]},A組
        鈴木花子,スズキハナコ,dup@example.com,#{Grade::DISPLAY_NAMES[1]},A組
        佐藤次郎,サトウジロウ,dup@example.com,#{Grade::DISPLAY_NAMES[1]},A組
        田中三郎,タナカサブロウ,taken@example.com,#{Grade::DISPLAY_NAMES[1]},A組
        伊藤四郎,,ito@example.com,#{Grade::DISPLAY_NAMES[1]},A組
      CSV
    end

    it 'dry runのvalid_countと、本実行で実際に成功した件数が一致する' do
      dry_run_result = described_class.new(file, high_school: high_school).call

      import_history = create(:import_history, user: teacher, unit: nil, import_type: :student)
      import_history.file.attach(io: StringIO.new(csv_content), filename: 'students.csv', content_type: 'text/csv')

      Teacher::StudentCsvBatchImportService.new(import_history).call
      import_history.reload

      # このCSVは1行(山田太郎)のみ有効、4行が無効(CSV内重複2件・他校メール1件・カナ未入力1件)。
      expect(dry_run_result[:valid_count]).to eq(1)
      expect(dry_run_result[:total_count]).to eq(5)

      # 無効行が1件でもあれば全件ロールバックされ、Userは1件も作成されない。
      expect(User.exists?(email: 'taro@example.com')).to be false
      expect(import_history.status).to eq('failed')
      expect(import_history.error_count).to eq(dry_run_result[:total_count] - dry_run_result[:valid_count])
    end
  end
end
