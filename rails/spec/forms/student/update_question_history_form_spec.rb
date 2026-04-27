# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::UpdateQuestionHistoryForm, type: :model do
  subject(:form) do
    described_class.new(
      current_user: user,
      **params
    )
  end

  let!(:prefecture) { create(:prefecture, name: '東京都') }
  let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }

  let!(:user) { create(:user, high_school: high_school) }
  let!(:goal) { create(:goal, user: user) }
  let!(:task) { create(:task, user: user, goal: goal) }

  let!(:course) { create(:course) }
  let!(:unit) { create(:unit, course: course) }
  let!(:task_unit) { create(:task_unit, task: task, unit: unit) }

  let!(:question) { create(:question, unit: unit) }

  let!(:choice_one) do
    create(:question_choice, question: question, choice_number: 1)
  end

  let!(:choice_two) do
    create(:question_choice, question: question, choice_number: 2)
  end

  let!(:question_history) do
    create(
      :question_history,
      user: user,
      task: task,
      course: course,
      unit: unit,
      question: question,
      question_choice: choice_one,
      answer_text: '更新前',
      time_spent_sec: 10,
      is_correct: false,
      explanation_viewed: false,
      answered_at: 1.day.ago
    )
  end

  let(:params) do
    {
      task_id: task.id,
      unit_id: unit.id,
      question_id: question.id,
      question_choice_id: choice_two.id,
      answer_text: '更新後',
      time_spent_sec: 35,
      is_correct: true,
      explanation_viewed: true
    }
  end

  describe '#save' do
    context '正常系' do
      it 'trueを返す' do
        expect(form.save).to be true
      end

      it 'QuestionHistoryの件数は増えない' do
        question_history

        expect { form.save }
          .not_to change(QuestionHistory, :count)
      end

      it '解答履歴が更新される' do
        old_answered_at = question_history.answered_at

        form.save

        question_history.reload

        expect(question_history.question_choice).to eq(choice_two)
        expect(question_history.answer_text).to eq('更新後')
        expect(question_history.time_spent_sec).to eq(35)
        expect(question_history.is_correct).to be true
        expect(question_history.explanation_viewed).to be true
        expect(question_history.answered_at).to be > old_answered_at
      end
    end

    context '異常系 - task_idが空' do
      let(:params) { super().merge(task_id: nil) }

      it 'falseを返す' do
        expect(form.save).to be false
      end
    end

    context '異常系 - unit_idが空' do
      let(:params) { super().merge(unit_id: nil) }

      it 'falseを返す' do
        expect(form.save).to be false
      end
    end

    context '異常系 - question_idが空' do
      let(:params) { super().merge(question_id: nil) }

      it 'falseを返す' do
        expect(form.save).to be false
      end
    end

    context '異常系 - question_choice_idが空' do
      let(:params) { super().merge(question_choice_id: nil) }

      it 'falseを返す' do
        expect(form.save).to be false
      end
    end

    context '異常系 - is_correctがnil' do
      let(:params) { super().merge(is_correct: nil) }

      it 'falseを返す' do
        expect(form.save).to be false
      end
    end

    context '異常系 - explanation_viewedがnil' do
      let(:params) { super().merge(explanation_viewed: nil) }

      it 'falseを返す' do
        expect(form.save).to be false
      end
    end

    context '異常系 - 解答履歴が存在しない' do
      before do
        question_history.destroy
      end

      it 'falseを返す' do
        expect(form.save).to be false
      end

      it 'errorsにメッセージが入る' do
        form.save

        expect(form.errors[:base]).to include('解答履歴が見つかりません')
      end
    end

    context '異常系 - 他人の解答履歴は更新できない' do
      subject(:form) do
        described_class.new(
          current_user: other_user,
          **params
        )
      end

      let!(:other_user) { create(:user, high_school: high_school) }

      it 'falseを返す' do
        expect(form.save).to be false
      end
    end
  end
end
