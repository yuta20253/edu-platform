# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::Analytics::UnderstandingScore, type: :model do
  describe '#call' do
    let!(:user) { create(:user) }

    let!(:goal) { create(:goal, user: user) }
    let!(:task) { create(:task, user: user, goal: goal) }

    let!(:subject_record) { create(:subject, name: '数学') }
    let!(:course) do
      create(
        :course,
        subject: subject_record,
        level_name: '数学Ⅰ',
        level_number: 1
      )
    end

    let!(:unit1) { create(:unit, course: course, unit_name: '方程式') }
    let!(:unit2) { create(:unit, course: course, unit_name: '関数') }

    before do
      question1 = create(:question, unit: unit1)
      question2 = create(:question, unit: unit1)
      question3 = create(:question, unit: unit2)

      create(
        :question_history,
        user: user,
        task: task,
        course: course,
        unit: unit1,
        question: question1,
        question_choice: create(:question_choice, question: question1),
        is_correct: true
      )

      create(
        :question_history,
        user: user,
        task: task,
        course: course,
        unit: unit1,
        question: question2,
        question_choice: create(:question_choice, question: question2),
        is_correct: false
      )

      create(
        :question_history,
        user: user,
        task: task,
        course: course,
        unit: unit2,
        question: question3,
        question_choice: create(:question_choice, question: question3),
        is_correct: true
      )
    end

    context '問題履歴が存在する場合' do
      it '理解度を返す' do
        result = described_class.new(user).call

        expect(result).to eq(
          subjects: [
            {
              subject_name: '数学',
              courses: [
                {
                  level_name: '数学Ⅰ',
                  level_number: 1,
                  units: [
                    {
                      unit_name: '方程式',
                      score: 50.0
                    },
                    {
                      unit_name: '関数',
                      score: 100.0
                    }
                  ]
                }
              ]
            }
          ]
        )
      end
    end

    context '問題履歴が存在しない場合' do
      let!(:empty_user) { create(:user) }

      it '空配列を返す' do
        result = described_class.new(empty_user).call

        expect(result).to eq(
          subjects: []
        )
      end
    end
  end
end
