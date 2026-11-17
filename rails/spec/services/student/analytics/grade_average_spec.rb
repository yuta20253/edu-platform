# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::Analytics::GradeAverage, type: :model do
  describe '#call' do
    let!(:grade) { create(:grade) }

    let!(:user) { create(:user, grade: grade) }
    let!(:other_user) { create(:user, grade: grade) }

    let!(:goal) { create(:goal, user: user) }
    let!(:other_goal) { create(:goal, user: other_user) }

    let!(:task) { create(:task, user: user, goal: goal, status: :completed) }
    let!(:task2) { create(:task, user: user, goal: goal) }

    let!(:other_task) do
      create(:task, user: other_user, goal: other_goal, status: :completed)
    end
    let!(:other_task2) do
      create(:task, user: other_user, goal: other_goal, status: :completed)
    end

    let!(:subject_record) { create(:subject) }
    let!(:course) { create(:course, subject: subject_record) }
    let!(:unit) { create(:unit, course: course) }

    before do
      # user: 正答率50%
      question1 = create(:question, unit: unit)
      question2 = create(:question, unit: unit)

      create(
        :question_history,
        user: user,
        task: task,
        course: course,
        unit: unit,
        question: question1,
        question_choice: create(:question_choice, question: question1),
        is_correct: true
      )

      create(
        :question_history,
        user: user,
        task: task,
        course: course,
        unit: unit,
        question: question2,
        question_choice: create(:question_choice, question: question2),
        is_correct: false
      )

      # other_user: 正答率100%
      other_question = create(:question, unit: unit)

      create(
        :question_history,
        user: other_user,
        task: other_task,
        course: course,
        unit: unit,
        question: other_question,
        question_choice: create(:question_choice, question: other_question),
        is_correct: true
      )
    end

    context '学年に複数人いる場合' do
      it '自分と学年平均を返す' do
        result = described_class.new(user).call

        expect(result).to eq(
          correct_rate: {
            my: 50.0,
            average: 66.7
          },
          task_completion_rate: {
            my: 50.0,
            average: 75.0
          }
        )
      end
    end

    context '学年に自分しかいない場合' do
      before do
        other_user.destroy!
      end

      it '自分の値が平均になる' do
        result = described_class.new(user).call

        expect(result).to eq(
          correct_rate: {
            my: 50.0,
            average: 50.0
          },
          task_completion_rate: {
            my: 50.0,
            average: 50.0
          }
        )
      end
    end

    context '同学年に教員がいる場合' do
      let!(:teacher) { create(:user, :teacher, grade: grade) }
      let!(:teacher_goal) { create(:goal, user: teacher) }
      let!(:teacher_task) do
        create(:task, user: teacher, goal: teacher_goal, status: :completed)
      end

      before do
        teacher_question = create(:question, unit: unit)

        create(
          :question_history,
          user: teacher,
          task: teacher_task,
          course: course,
          unit: unit,
          question: teacher_question,
          question_choice: create(:question_choice, question: teacher_question),
          is_correct: true
        )
      end

      it '教員の解答履歴・タスクは学年平均の母集団から除外される' do
        result = described_class.new(user).call

        expect(result).to eq(
          correct_rate: {
            my: 50.0,
            average: 66.7
          },
          task_completion_rate: {
            my: 50.0,
            average: 75.0
          }
        )
      end
    end

    context '同学年に論理削除済みの生徒がいる場合' do
      let!(:deleted_user) { create(:user, grade: grade, deleted_at: Time.current) }
      let!(:deleted_user_goal) { create(:goal, user: deleted_user) }
      let!(:deleted_user_task) do
        create(:task, user: deleted_user, goal: deleted_user_goal, status: :completed)
      end

      before do
        deleted_user_question = create(:question, unit: unit)

        create(
          :question_history,
          user: deleted_user,
          task: deleted_user_task,
          course: course,
          unit: unit,
          question: deleted_user_question,
          question_choice: create(:question_choice, question: deleted_user_question),
          is_correct: true
        )
      end

      it '論理削除済みの生徒の解答履歴・タスクは学年平均の母集団から除外される' do
        result = described_class.new(user).call

        expect(result).to eq(
          correct_rate: {
            my: 50.0,
            average: 66.7
          },
          task_completion_rate: {
            my: 50.0,
            average: 75.0
          }
        )
      end
    end

    context '問題履歴もタスクも存在しない場合' do
      let!(:empty_user) { create(:user, grade: create(:grade)) }

      it '全て0を返す' do
        result = described_class.new(empty_user).call

        expect(result).to eq(
          correct_rate: {
            my: 0,
            average: 0
          },
          task_completion_rate: {
            my: 0,
            average: 0
          }
        )
      end
    end
  end
end
