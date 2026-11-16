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

    context '同率のユーザーが複数いる場合' do
      let!(:tie_course) { create(:course, subject: math_subject) }
      let!(:tie_unit) { create(:unit, course: tie_course) }

      let!(:user_top) { create(:user, grade: grade) }
      let!(:user_mid1) { create(:user, grade: grade) }
      let!(:user_mid2) { create(:user, grade: grade) }
      let!(:user_bottom) { create(:user, grade: grade) }

      def create_history(target_user, is_correct)
        goal = create(:goal, user: target_user)
        task = create(:task, user: target_user, goal: goal)
        question = create(:question, unit: tie_unit)
        choice = create(:question_choice, question: question)

        create(
          :question_history,
          user: target_user,
          task: task,
          course: tie_course,
          unit: tie_unit,
          question: question,
          question_choice: choice,
          is_correct: is_correct
        )
      end

      before do
        # user_top: 2/2 = 100%
        create_history(user_top, true)
        create_history(user_top, true)

        # user_mid1, user_mid2: 1/2 = 50%(同率)
        create_history(user_mid1, true)
        create_history(user_mid1, false)

        create_history(user_mid2, true)
        create_history(user_mid2, false)

        # user_bottom: 0/2 = 0%
        create_history(user_bottom, false)
        create_history(user_bottom, false)
      end

      it '同率は同順位になり、次の順位は人数分飛ぶ(1位・2位・2位・4位)' do
        expect(described_class.new(user_top, :course_id, tie_course.id).call[:rank]).to eq(1)
        expect(described_class.new(user_mid1, :course_id, tie_course.id).call[:rank]).to eq(2)
        expect(described_class.new(user_mid2, :course_id, tie_course.id).call[:rank]).to eq(2)
        expect(described_class.new(user_bottom, :course_id, tie_course.id).call[:rank]).to eq(4)
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
