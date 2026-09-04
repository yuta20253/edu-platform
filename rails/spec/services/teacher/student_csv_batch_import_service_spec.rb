# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::StudentCsvBatchImportService, type: :service do
  let!(:student_role) { create(:user_role, :student) }
  let(:teacher) { create(:user, :teacher, high_school: high_school) }
  let!(:high_school) { create(:high_school) }
  let!(:grade) { create(:grade, high_school: high_school, year: 1) }
  let!(:school_class) { create(:school_class, grade: grade, name: 'A組') }

  let!(:import_history) do
    ih = create(:import_history, user: teacher, unit: nil, import_type: :student)
    ih.file.attach(io: StringIO.new(csv_content), filename: 'students.csv', content_type: 'text/csv')
    ih
  end

  describe '#call' do
    context '正常系（新規作成）' do
      let(:csv_content) do
        <<~CSV
          氏名,氏名カナ,メール,学年,学級
          山田太郎,ヤマダタロウ,taro@example.com,#{Grade::DISPLAY_NAMES[1]},A組
        CSV
      end

      it 'Userが作成されImportHistoryがcompletedになる' do
        expect { described_class.new(import_history).call }.to change(User, :count).by(1)

        import_history.reload
        expect(import_history.status).to eq('completed')
        expect(import_history.success_count).to eq(1)
      end

      it '生徒コードが発行される' do
        described_class.new(import_history).call

        user = User.find_by(email: 'taro@example.com')
        expect(user.student_number).to be_present
      end

      it '新規作成された生徒に招待メールが送信される' do
        expect { described_class.new(import_history).call }.to have_enqueued_mail(AuthMailer, :invite_user).once
      end
    end

    context '同じCSVを2回インポートした場合（冪等性）' do
      let(:csv_content) do
        <<~CSV
          氏名,氏名カナ,メール,学年,学級
          山田太郎,ヤマダタロウ,taro@example.com,#{Grade::DISPLAY_NAMES[1]},A組
        CSV
      end

      it '2回目はUserが増えない' do
        described_class.new(import_history).call

        second_import_history = create(:import_history, user: teacher, unit: nil, import_type: :student)
        second_import_history.file.attach(io: StringIO.new(csv_content), filename: 'students.csv',
                                          content_type: 'text/csv')

        expect { described_class.new(second_import_history).call }.not_to change(User, :count)
      end

      it '2回目は招待メールが再送信されない' do
        described_class.new(import_history).call

        second_import_history = create(:import_history, user: teacher, unit: nil, import_type: :student)
        second_import_history.file.attach(io: StringIO.new(csv_content), filename: 'students.csv',
                                          content_type: 'text/csv')

        expect { described_class.new(second_import_history).call }
          .not_to have_enqueued_mail(AuthMailer, :invite_user)
      end
    end

    context 'CSV内でメールアドレスが重複している場合' do
      let(:csv_content) do
        <<~CSV
          氏名,氏名カナ,メール,学年,学級
          山田太郎,ヤマダタロウ,dup@example.com,#{Grade::DISPLAY_NAMES[1]},A組
          鈴木花子,スズキハナコ,dup@example.com,#{Grade::DISPLAY_NAMES[1]},A組
        CSV
      end

      it 'Userが作成されずImportErrorが記録されfailedになる' do
        expect { described_class.new(import_history).call }.not_to change(User, :count)

        import_history.reload
        expect(import_history.status).to eq('failed')
        expect(import_history.import_errors.map(&:message).join).to include('重複')
      end
    end

    context '他校の既存Userとメールアドレスが一致する場合' do
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

      it '他校のUserは更新されずfailedになる' do
        described_class.new(import_history).call

        expect(other_school_user.reload.high_school_id).to eq(other_high_school.id)
        import_history.reload
        expect(import_history.status).to eq('failed')
      end
    end

    context '一部の行は有効だが別の行のエラーでバッチ全体が失敗する場合' do
      let(:csv_content) do
        <<~CSV
          氏名,氏名カナ,メール,学年,学級
          山田太郎,ヤマダタロウ,taro@example.com,#{Grade::DISPLAY_NAMES[1]},A組
          鈴木花子,スズキハナコ,hanako@example.com,#{Grade::DISPLAY_NAMES[1]},存在しない組
        CSV
      end

      it '有効な行も含めUserが作成されない(ロールバック)' do
        expect { described_class.new(import_history).call }.not_to change(User, :count)

        expect(import_history.reload.status).to eq('failed')
      end

      it 'ロールバックされた行の招待メールは送信されない' do
        expect { described_class.new(import_history).call }
          .not_to have_enqueued_mail(AuthMailer, :invite_user)
      end
    end

    context '存在しない学級が指定された場合' do
      let(:csv_content) do
        <<~CSV
          氏名,氏名カナ,メール,学年,学級
          山田太郎,ヤマダタロウ,taro@example.com,#{Grade::DISPLAY_NAMES[1]},存在しない組
        CSV
      end

      it 'Userが作成されずfailedになる' do
        expect { described_class.new(import_history).call }.not_to change(User, :count)

        import_history.reload
        expect(import_history.status).to eq('failed')
      end
    end
  end
end
