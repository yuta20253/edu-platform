# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::QuestionImportForm, type: :model do
  let(:params) do
    {
      question_text: '問題文',
      correct_answer: 1,
      explanation_text: '解説',
      choices: %w[A B C D],
      hints: %w[ヒント1 ヒント2]
    }
  end

  describe '#valid?' do
    context '全属性が有効な値のとき' do
      it 'valid?がtrueになる' do
        form = described_class.new(params)
        expect(form.valid?).to be true
      end
    end

    context 'question_textが空のとき' do
      it 'invalidになる' do
        form = described_class.new(params.merge(question_text: ''))
        expect(form.valid?).to be false
        expect(form.errors[:question_text]).to be_present
      end
    end

    context 'correct_answerが未指定のとき' do
      it 'invalidになる' do
        form = described_class.new(params.merge(correct_answer: nil))
        expect(form.valid?).to be false
        expect(form.errors[:correct_answer]).to be_present
      end
    end

    context 'correct_answerが範囲外のとき' do
      it '0のときinvalidになる' do
        form = described_class.new(params.merge(correct_answer: 0))
        expect(form.valid?).to be false
        expect(form.errors[:correct_answer]).to be_present
      end

      it '5のときinvalidになる' do
        form = described_class.new(params.merge(correct_answer: 5))
        expect(form.valid?).to be false
        expect(form.errors[:correct_answer]).to be_present
      end
    end

    context 'correct_answerが1から4のとき' do
      it 'validになる' do
        (1..4).each do |n|
          form = described_class.new(params.merge(correct_answer: n))
          expect(form.valid?).to be true
        end
      end
    end

    context 'explanation_textが空のとき' do
      it 'invalidになる' do
        form = described_class.new(params.merge(explanation_text: ''))
        expect(form.valid?).to be false
        expect(form.errors[:explanation_text]).to be_present
      end
    end

    context 'choicesが3つのとき' do
      it 'invalidになる' do
        form = described_class.new(params.merge(choices: %w[A B C]))
        expect(form.valid?).to be false
        expect(form.errors[:choices]).to be_present
      end
    end

    context 'choicesが5つのとき' do
      it 'invalidになる' do
        form = described_class.new(params.merge(choices: %w[A B C D E]))
        expect(form.valid?).to be false
        expect(form.errors[:choices]).to be_present
      end
    end

    context 'choicesがちょうど4つのとき' do
      it 'validになる' do
        form = described_class.new(params.merge(choices: %w[A B C D]))
        expect(form.valid?).to be true
      end
    end

    context 'hintsが0個のとき' do
      it 'validになる' do
        form = described_class.new(params.merge(hints: []))
        expect(form.valid?).to be true
      end
    end

    context 'hintsが1個のとき' do
      it 'validになる' do
        form = described_class.new(params.merge(hints: ['ヒント1']))
        expect(form.valid?).to be true
      end
    end

    context 'hintsが2個のとき' do
      it 'validになる' do
        form = described_class.new(params.merge(hints: %w[ヒント1 ヒント2]))
        expect(form.valid?).to be true
      end
    end

    context 'hintsが3個のとき' do
      it 'invalidになる' do
        form = described_class.new(params.merge(hints: %w[ヒント1 ヒント2 ヒント3]))
        expect(form.valid?).to be false
        expect(form.errors[:hints]).to be_present
      end
    end

    context '複数属性が同時に無効なとき' do
      it 'full_messagesに各属性のエラーが含まれる' do
        form = described_class.new(
          question_text: '',
          correct_answer: nil,
          explanation_text: '',
          choices: %w[A B],
          hints: []
        )
        expect(form.valid?).to be false

        expect(form.errors[:question_text]).to be_present
        expect(form.errors[:correct_answer]).to be_present
        expect(form.errors[:explanation_text]).to be_present
        expect(form.errors[:choices]).to be_present
      end
    end
  end
end
