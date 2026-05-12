# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::QuestionAnswerJudgeService, type: :model do
  describe '#call' do
    let!(:course) { create(:course) }
    let!(:unit) { create(:unit, course: course) }

    context '正解の場合' do
      subject(:result) do
        described_class.new(
          question: question,
          question_choice_id: choice.id
        ).call
      end

      let!(:question) { create(:question, unit: unit, correct_answer: 1) }
      let!(:choice) do
        create(:question_choice, question: question, choice_number: 1)
      end

      it 'Hashを返す' do
        expect(result).to be_a(Hash)
      end

      it 'selected_answerが正しく返る' do
        expect(result[:selected_answer]).to eq(1)
      end

      it 'correct_answerが正しく返る' do
        expect(result[:correct_answer]).to eq(1)
      end

      it 'is_correctがtrueになる' do
        expect(result[:is_correct]).to be true
      end
    end

    context '不正解の場合' do
      subject(:result) do
        described_class.new(
          question: question,
          question_choice_id: choice.id
        ).call
      end

      let!(:question) { create(:question, unit: unit, correct_answer: 1) }
      let!(:choice) do
        create(:question_choice, question: question, choice_number: 2)
      end

      it 'selected_answerが選択肢の番号になる' do
        expect(result[:selected_answer]).to eq(2)
      end

      it 'correct_answerが正しく返る' do
        expect(result[:correct_answer]).to eq(1)
      end

      it 'is_correctがfalseになる' do
        expect(result[:is_correct]).to be false
      end
    end

    context 'correct_answerが文字列の場合' do
      subject(:result) do
        described_class.new(
          question: question,
          question_choice_id: choice.id
        ).call
      end

      let!(:question) { create(:question, unit: unit, correct_answer: '1') }
      let!(:choice) do
        create(:question_choice, question: question, choice_number: 1)
      end

      it 'correct_answerが整数に変換される' do
        expect(result[:correct_answer]).to eq(1)
      end

      it 'is_correctがtrueになる' do
        expect(result[:is_correct]).to be true
      end
    end

    context '存在しない選択肢IDの場合' do
      subject do
        described_class.new(
          question: question,
          question_choice_id: 999_999
        ).call
      end

      let!(:question) { create(:question, unit: unit, correct_answer: 1) }

      it 'ActiveRecord::RecordNotFoundが発生する' do
        expect { subject }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end
end
