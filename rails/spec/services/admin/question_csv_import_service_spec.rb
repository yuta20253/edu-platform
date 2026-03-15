# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::QuestionCsvImportService do
  describe '#call' do
    let(:unit) { create(:unit) }

    let(:form) do
      Admin::QuestionImportForm.new(
        question_text: '1+1は？',
        correct_answer: 2,
        explanation_text: '1+1=2です',
        choices: ['1', '2', '3', '4'],
        hints: ['まず1を考える', '次に1を足す']
      )
    end

    subject(:service_call) { described_class.new(form, unit.id).call }

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
        ).to eq [1,2,3,4]
      end

      it 'step_numberが正しく保存される' do
        service_call

        expect(
          QuestionHint.order(:step_number).pluck(:step_number)
        ).to eq [1,2]
      end
    end

    context '同じデータを再インポートした場合' do
      it 'questionは重複作成されない' do
        service_call

        expect { service_call }.not_to change(Question, :count)
      end
    end
  end
end
