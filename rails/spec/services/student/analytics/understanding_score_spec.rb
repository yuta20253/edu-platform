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

    context '取得順とsubjects.idの順が逆の場合' do
      let!(:subject_a) { create(:subject, name: '国語') }
      let!(:subject_b) { create(:subject, name: '英語') }

      let!(:course_a) { create(:course, subject: subject_a) }
      let!(:course_b) { create(:course, subject: subject_b) }

      let!(:unit_a) { create(:unit, course: course_a) }
      let!(:unit_b) { create(:unit, course: course_b) }

      let!(:history_b) do
        question_b = create(:question, unit: unit_b)
        create(
          :question_history,
          user: user,
          task: task,
          course: course_b,
          unit: unit_b,
          question: question_b,
          question_choice: create(:question_choice, question: question_b),
          is_correct: true
        )
      end

      let!(:history_a) do
        question_a = create(:question, unit: unit_a)
        create(
          :question_history,
          user: user,
          task: task,
          course: course_a,
          unit: unit_a,
          question: question_a,
          question_choice: create(:question_choice, question: question_a),
          is_correct: true
        )
      end

      before do
        # subject_a(id小)がsubject_b(id大)より後に取得される状況を作り、group_byの出現順とidの昇順をずらす
        allow(user.question_histories).to receive(:includes).and_return([history_b, history_a])
      end

      it 'subjects.idの昇順で返る' do
        result = described_class.new(user).call

        subject_names = result[:subjects].pluck(:subject_name)

        expect(subject_names).to eq([subject_a.name, subject_b.name])
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
