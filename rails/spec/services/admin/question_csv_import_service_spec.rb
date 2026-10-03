# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::QuestionCsvImportService do
  describe '#call' do
    subject(:service_call) { described_class.new(form, unit.id).call }

    let(:unit) { create(:unit) }

    let(:form) do
      Admin::QuestionImportForm.new(
        question_text: '1+1は？',
        correct_answer: 2,
        explanation_text: '1+1=2です',
        choices: %w[1 2 3 4],
        hints: %w[まず1を考える 次に1を足す]
      )
    end

    context '正常系' do
      it 'questionを作成する' do
        expect { service_call }.to change(Question, :count).by(1)
      end

      it 'explanationを作成する' do
        expect { service_call }.to change(QuestionExplanation, :count).by(1)
      end

      it 'choicesを作成する' do
        expect { service_call }.to change(QuestionChoice, :count).by(4)
      end

      it 'hintsを作成する' do
        expect { service_call }.to change(QuestionHint, :count).by(2)
      end

      it 'choice_numberが正しく保存される' do
        service_call

        expect(
          QuestionChoice.order(:choice_number).pluck(:choice_number)
        ).to eq [1, 2, 3, 4]
      end

      it 'step_numberが正しく保存される' do
        service_call

        expect(
          QuestionHint.order(:step_number).pluck(:step_number)
        ).to eq [1, 2]
      end
    end

    context '同じデータを再インポートした場合' do
      it 'questionは重複作成されない' do
        described_class.new(form, unit.id).call

        expect { described_class.new(form, unit.id).call }.not_to change(Question, :count)
      end
    end

    context '同一内容のquestionが論理削除済みの場合' do
      let!(:deleted_question) do
        create(
          :question,
          unit: unit,
          question_text: '1+1は？',
          correct_answer: '2',
          deleted_at: Time.current
        )
      end

      it '論理削除済みを復活させず新しいquestionを作成する' do
        expect { service_call }.to change(Question, :count).by(1)
      end

      it '論理削除済みquestionはdeleted_atのまま' do
        service_call

        expect(deleted_question.reload.deleted_at).to be_present
      end
    end

    context 'activeなquestionにchoice_numberが同じ論理削除済みchoiceがある場合' do
      # question_choices は (question_id, choice_number) が UNIQUE で deleted_at を含まない。
      # .active だけで find すると論理削除済みchoiceを見落とし、新規INSERTでUNIQUE違反になる。
      let!(:existing_question) do
        create(:question, unit: unit, question_text: '1+1は？', correct_answer: 2)
      end
      let!(:deleted_choice) do
        create(
          :question_choice,
          question: existing_question,
          choice_number: 1,
          choice_text: '古い選択肢',
          deleted_at: Time.current
        )
      end

      it 'UNIQUE制約違反を起こさずにインポートできる' do
        expect { service_call }.not_to raise_error
      end

      it 'choice_number=1 のactiveなchoiceが1件存在する' do
        service_call

        expect(QuestionChoice.active.where(question_id: existing_question.id, choice_number: 1).count).to eq(1)
      end

      it '復活したchoiceの内容が更新される' do
        service_call

        expect(deleted_choice.reload.choice_text).to eq('1')
        expect(deleted_choice.reload.deleted_at).to be_nil
      end
    end

    context 'activeなquestionにexplanation_typeが同じ論理削除済みexplanationがある場合' do
      # question_explanations は (question_id, explanation_type) が UNIQUE で deleted_at を含まない。
      # .active だけで find すると論理削除済みexplanationを見落とし、新規INSERTでUNIQUE違反になる。
      let!(:existing_question) do
        create(:question, unit: unit, question_text: '1+1は？', correct_answer: 2)
      end
      let!(:deleted_explanation) do
        create(
          :question_explanation,
          question: existing_question,
          explanation_type: QuestionExplanation::BASIC,
          explanation_text: '古い解説',
          deleted_at: Time.current
        )
      end

      it 'UNIQUE制約違反を起こさずにインポートできる' do
        expect { service_call }.not_to raise_error
      end

      it '復活したexplanationの内容が更新される' do
        service_call

        expect(deleted_explanation.reload.explanation_text).to eq('1+1=2です')
        expect(deleted_explanation.reload.deleted_at).to be_nil
      end
    end

    context 'activeなquestionにstep_numberが同じ論理削除済みhintがある場合' do
      # question_hints は (question_id, step_number) が UNIQUE で deleted_at を含まない。
      # .active だけで find すると論理削除済みhintを見落とし、新規INSERTでUNIQUE違反になる。
      let!(:existing_question) do
        create(:question, unit: unit, question_text: '1+1は？', correct_answer: 2)
      end
      let!(:deleted_hint) do
        create(
          :question_hint,
          question: existing_question,
          step_number: 1,
          hint_text: '古いヒント',
          deleted_at: Time.current
        )
      end

      it 'UNIQUE制約違反を起こさずにインポートできる' do
        expect { service_call }.not_to raise_error
      end

      it 'step_number=1 のactiveなhintが1件存在する' do
        service_call

        expect(QuestionHint.active.where(question_id: existing_question.id, step_number: 1).count).to eq(1)
      end
    end
  end
end
