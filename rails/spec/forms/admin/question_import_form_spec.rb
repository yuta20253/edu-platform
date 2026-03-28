# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::QuestionImportForm do
  describe 'validation' do
    subject(:form) { described_class.new(params) }

    let(:params) do
      {
        question_text: '1+1は？',
        correct_answer: 1,
        explanation_text: '1+1=2です',
        choices: %w[1 2 3 4],
        hints: ['ヒント1']
      }
    end

    context '正常な場合' do
      it 'validになる' do
        expect(form).to be_valid
      end
    end

    context 'question_textが空の場合' do
      before { params[:question_text] = nil }

      it 'invalidになる' do
        expect(form).not_to be_valid
        expect(form.errors[:question_text]).to be_present
      end
    end

    context 'correct_answerが空の場合' do
      before { params[:correct_answer] = nil }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end
    end

    context 'correct_answerが1〜4以外の場合' do
      before { params[:correct_answer] = 5 }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end
    end

    context 'explanation_textが空の場合' do
      before { params[:explanation_text] = nil }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end
    end

    context 'choicesが4つでない場合' do
      before { params[:choices] = %w[1 2] }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end
    end

    context 'hintsが3つ以上の場合' do
      before { params[:hints] = %w[1 2 3] }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end
    end
  end
end
