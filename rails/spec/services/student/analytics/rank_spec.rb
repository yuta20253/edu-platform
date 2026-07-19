# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::Analytics::Rank, type: :model do
  describe '#call' do
    let!(:grade) { create(:grade) }
    let!(:user) { create(:user, grade: grade) }
    let!(:other_user) { create(:user, grade: grade) }

    let!(:goal) { create(:goal, user: user) }
    let!(:other_goal) { create(:goal, user: other_user) }

    let!(:task) { create(:task, user: user, goal: goal) }
    let!(:other_task) { create(:task, user: other_user, goal: other_goal) }

    let!(:math_subject) { create(:subject) }
    let!(:course) { create(:course, subject: math_subject) }
    let!(:unit) { create(:unit, course: course) }

    let!(:question1) { create(:question, unit: unit) }
    let!(:question2) { create(:question, unit: unit) }

    let!(:choice1) { create(:question_choice, question: question1) }
    let!(:choice2) { create(:question_choice, question: question2) }

    before do
      # user: 50%
      create(
        :question_history,
        user: user,
        task: task,
        course: course,
        unit: unit,
        question: question1,
        question_choice: choice1,
        is_correct: true
      )

      create(
        :question_history,
        user: user,
        task: task,
        course: course,
        unit: unit,
        question: question2,
        question_choice: choice2,
        is_correct: false
      )

      # other_user:100%
      other_question = create(:question, unit: unit)
      other_choice = create(:question_choice, question: other_question)

      create(
        :question_history,
        user: other_user,
        task: other_task,
        course: course,
        unit: unit,
        question: other_question,
        question_choice: other_choice,
        is_correct: true
      )
    end

    context 'ランキングが存在する場合' do
      it '順位を返す' do
        result = described_class.new(user, :course_id, course.id).call

        expect(result).to eq(
          rank: 2,
          total_users: 2
        )
      end
    end

    context 'ランキング対象が存在しない場合' do
      it '順位はnilを返す' do
        result = described_class.new(user, :course_id, 999_999).call

        expect(result).to eq(
          rank: nil,
          total_users: 0
        )
      end
    end

    context '対象ユーザーがランキングに存在しない場合' do
      let!(:another_user) { create(:user, grade: grade) }

      it '順位はnilを返す' do
        result = described_class.new(another_user, :course_id, course.id).call

        expect(result).to eq(
          rank: nil,
          total_users: 2
        )
      end
    end
  end
end
