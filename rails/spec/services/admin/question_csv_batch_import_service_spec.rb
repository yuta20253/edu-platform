# spec/services/admin/question_csv_batch_import_service_spec.rb
require 'rails_helper'

RSpec.describe Admin::QuestionCsvBatchImportService, type: :service do
  let(:user) { create(:user, :admin, high_school: nil) }
  let(:unit) { create(:unit) }

  # attachはlet!で即評価する
  let!(:import_history) do
    ih = create(:import_history, user: user, unit: unit)
    ih.file.attach(io: StringIO.new(csv_content), filename: 'questions.csv', content_type: 'text/csv')
    ih
  end

  describe '#call' do
    context '正常系（全行成功）' do
      let(:csv_content) do
        <<~CSV
          問題文,正解番号,解説,選択肢1,選択肢2,選択肢3,選択肢4
          問題1,1,解説,A,B,C,D
        CSV
      end

      it 'Questionが作成されImportHistoryがcompletedになる' do
        service = described_class.new(import_history)
        expect { service.call }.to change { Question.count }.by(1)
        import_history.reload
        expect(import_history.status).to eq('completed')
        expect(import_history.success_count).to eq(1)
        expect(import_history.total_count).to eq(1)
      end
    end

    context 'ヘッダー欠損CSV' do
      let(:csv_content) do
        <<~CSV
          問題文,正解番号
          問題1,1
        CSV
      end

      it 'ImportErrorが作成されfailedになる' do
        service = described_class.new(import_history)
        expect {
          # transaction干渉回避のため、countをトランザクション外で確認
          service.call
        }.to change { ImportError.count }.by(1)
        import_history.reload
        expect(import_history.status).to eq('failed')
        expect(import_history.error_count).to eq(1)
      end
    end

    context '選択肢や正解番号が欠けている場合' do
      let(:csv_content) do
        <<~CSV
          問題文,正解番号,解説,選択肢1,選択肢2,選択肢3,選択肢4
          問題1,,解説,A,B,C,
        CSV
      end

      it 'ImportErrorが作成されfailedになる' do
        service = described_class.new(import_history)
        expect { service.call }.to change { ImportError.count }.by(1)
        import_history.reload
        expect(import_history.status).to eq('failed')
        expect(import_history.error_count).to eq(1)
      end
    end

    context '途中行でエラーが発生した場合' do
      let(:csv_content) do
        <<~CSV
          問題文,正解番号,解説,選択肢1,選択肢2,選択肢3,選択肢4
          問題1,1,解説,A,B,C,D
          ,1,解説,A,B,C,D
        CSV
      end

      it 'transactionがrollbackされQuestionは作成されない' do
        service = described_class.new(import_history)
        expect { service.call }.not_to change { Question.count }
        import_history.reload
        expect(import_history.status).to eq('failed')
        expect(import_history.error_count).to eq(1)
      end
    end

    context 'StandardErrorが発生した場合' do
      let(:csv_content) do
        <<~CSV
          問題文,正解番号,解説,選択肢1,選択肢2,選択肢3,選択肢4
          問題1,1,解説,A,B,C,D
        CSV
      end

      it 'failedになるが例外はそのまま上がる' do
        service_double = instance_double(Admin::QuestionCsvImportService)
        allow(Admin::QuestionCsvImportService).to receive(:new).and_return(service_double)
        allow(service_double).to receive(:call).and_raise(StandardError)

        service = described_class.new(import_history)

        expect { service.call }.to raise_error(StandardError)
        import_history.reload
        expect(import_history.status).to eq('failed')
        expect(import_history.finished_at).to be_present
      end
    end
  end
end
