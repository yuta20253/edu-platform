# frozen_string_literal: true

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
        expect { service.call }.to change(Question, :count).by(1)
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
        expect do
          # transaction干渉回避のため、countをトランザクション外で確認
          service.call
        end.to change(ImportError, :count).by(1)
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
        expect { service.call }.to change(ImportError, :count).by(1)
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
        expect { service.call }.not_to(change(Question, :count))
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

    context 'overwriteモード', db_clean: :truncation do
      let!(:import_history) do
        ih = create(:import_history, :overwrite, user: user, unit: unit)
        ih.file.attach(io: StringIO.new(csv_content), filename: 'questions.csv', content_type: 'text/csv')
        ih
      end

      # 既存問題（子レコード付き）
      let!(:existing_question) { create(:question, unit: unit, question_text: '既存問題', correct_answer: '1') }
      let!(:existing_choice) { create(:question_choice, question: existing_question) }
      let!(:existing_hint) { create(:question_hint, question: existing_question) }
      let!(:existing_explanation) { create(:question_explanation, question: existing_question) }

      # 既存問題に紐づく回答履歴（overwriteでも破壊されないことを確認する）
      let!(:existing_history) do
        create(
          :question_history,
          question: existing_question,
          question_choice: existing_choice,
          unit: unit,
          user: user,
          task: create(:task, user: user)
        )
      end

      context '正常系' do
        let(:csv_content) do
          <<~CSV
            問題文,正解番号,解説,選択肢1,選択肢2,選択肢3,選択肢4
            新問題,1,解説,A,B,C,D
          CSV
        end

        it '既存問題は論理削除されCSVの新問題だけがactiveになる' do
          described_class.new(import_history).call

          expect(Question.active.pluck(:question_text)).to contain_exactly('新問題')
        end

        it '既存問題はdeleted_atが付与される' do
          described_class.new(import_history).call

          expect(existing_question.reload.deleted_at).to be_present
        end

        it '論理削除時にupdated_atも更新される' do
          existing_question.update_columns(updated_at: 1.day.ago)
          existing_choice.update_columns(updated_at: 1.day.ago)

          described_class.new(import_history).call

          expect(existing_question.reload.updated_at).to be > 1.hour.ago
          expect(existing_choice.reload.updated_at).to be > 1.hour.ago
        end

        it '回答履歴(question_histories)は破壊されない' do
          expect { described_class.new(import_history).call }.not_to(change(QuestionHistory, :count))
        end

        it 'ImportHistoryがcompletedになる' do
          described_class.new(import_history).call

          expect(import_history.reload.status).to eq('completed')
        end
      end

      context '削除後の取り込みで途中行エラーが発生した場合' do
        let(:csv_content) do
          <<~CSV
            問題文,正解番号,解説,選択肢1,選択肢2,選択肢3,選択肢4
            新問題,1,解説,A,B,C,D
            ,1,解説,A,B,C,D
          CSV
        end

        it 'ロールバックされ既存問題の論理削除も取り消される' do
          described_class.new(import_history).call

          expect(existing_question.reload.deleted_at).to be_nil
        end

        it 'failedになる' do
          described_class.new(import_history).call

          expect(import_history.reload.status).to eq('failed')
        end
      end
    end
  end
end
