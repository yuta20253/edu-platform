# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::CreateQuestionHistoryForm, type: :model do
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
  let!(:question_choice) do
    create(:question_choice, question: question, choice_number: 1)
  end

  let(:params) do
    {
      task_id: task.id,
      unit_id: unit.id,
      question_id: question.id,
      question_choice_id: question_choice.id,
      answer_text: 'テスト回答',
      time_spent_sec: 25,
      is_correct: true,
      explanation_viewed: false
    }
  end

  describe '#save' do
    context '正常系' do
      it 'QuestionHistoryが作成される' do
        expect { form.save }
          .to change(QuestionHistory, :count).by(1)
      end

      it 'trueを返す' do
        expect(form.save).to be true
      end

      it '回答履歴が正しく保存される' do
        form.save

        history = QuestionHistory.last

        expect(history.user).to eq(user)
        expect(history.task).to eq(task)
        expect(history.course).to eq(course)
        expect(history.unit).to eq(unit)
        expect(history.question).to eq(question)
        expect(history.question_choice).to eq(question_choice)
        expect(history.answer_text).to eq('テスト回答')
        expect(history.time_spent_sec).to eq(25)
        expect(history.is_correct).to be true
        expect(history.explanation_viewed).to be false
        expect(history.answered_at).to be_present
      end
    end

    context '異常系 - task_idが空' do
      let(:params) { super().merge(task_id: nil) }

      it 'falseを返す' do
        expect(form.save).to be false
      end

      it '作成されない' do
        expect { form.save }
          .not_to change(QuestionHistory, :count)
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

    context '異常系 - 自分のtaskではない' do
      let!(:other_user) { create(:user, high_school: high_school) }
      let!(:other_goal) { create(:goal, user: other_user) }
      let!(:other_task) { create(:task, user: other_user, goal: other_goal) }

      let(:params) { super().merge(task_id: other_task.id) }

      it 'falseを返す' do
        expect(form.save).to be false
      end
    end

    context '異常系 - taskに紐づかないunit' do
      let!(:other_unit) { create(:unit, course: course) }

      let(:params) { super().merge(unit_id: other_unit.id) }

      it 'falseを返す' do
        expect(form.save).to be false
      end
    end

    context '異常系 - unitに紐づかないquestion' do
      let!(:other_question) { create(:question, unit: create(:unit, course: course)) }

      let(:params) { super().merge(question_id: other_question.id) }

      it 'falseを返す' do
        expect(form.save).to be false
      end
    end
  end
end
