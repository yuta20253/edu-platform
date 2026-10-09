# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Common::TaskProgressService do
  subject(:result) { described_class.new(user: user, tasks: tasks).call }

  let!(:user) { create(:user) }
  let!(:goal) { create(:goal, user: user) }
  let!(:task_a) { create(:task, user: user, goal: goal) }
  let!(:task_b) { create(:task, user: user, goal: goal) }
  let!(:task_without_units) { create(:task, user: user, goal: goal) }

  let!(:course) { create(:course) }
  let!(:unit_one) { create(:unit, course: course) }
  let!(:unit_two) { create(:unit, course: course) }
  let!(:unit_without_questions) { create(:unit, course: course) }

  let!(:question_one) { create(:question, unit: unit_one) }
  let!(:question_two) { create(:question, unit: unit_one) }
  let!(:question_three) { create(:question, unit: unit_one) }
  let!(:question_four) { create(:question, unit: unit_two) }

  # Controllerと同じく、unitsを読み込み済みのタスクを渡す
  let(:tasks) do
    TasksQuery.new(user.tasks.where(id: [task_a.id, task_b.id, task_without_units.id]))
              .includes_units
              .result
              .to_a
  end

  before do
    create(:task_unit, task: task_a, unit: unit_one)
    create(:task_unit, task: task_a, unit: unit_two)
    create(:task_unit, task: task_a, unit: unit_without_questions)
    create(:task_unit, task: task_b, unit: unit_one)
  end

  def answer!(task:, question:, is_correct:, answerer: user)
    create(
      :question_history,
      user: answerer,
      task: task,
      course: question.unit.course,
      unit: question.unit,
      question: question,
      question_choice: question.question_choices.first || create(:question_choice, question: question),
      is_correct: is_correct
    )
  end

  def count_queries(&block)
    queries = []
    callback = lambda { |_n, _s, _f, _id, payload|
      queries << payload[:sql] if payload[:name] != 'SCHEMA'
    }
    ActiveSupport::Notifications.subscribed(callback, 'sql.active_record', &block)
    queries.size
  end

  describe '#call' do
    context '一部のUnitに解答している場合' do
      before do
        answer!(task: task_a, question: question_one, is_correct: true)
        answer!(task: task_a, question: question_two, is_correct: false)
        answer!(task: task_a, question: question_four, is_correct: true)
      end

      it 'Unitごとの件数と率を返す(未解答・問題0問のUnitも含む)' do
        expect(result[task_a.id][:units]).to eq(
          unit_one.id => {
            total_questions: 3, answered_count: 2, correct_count: 1, progress_rate: 66.7, correct_rate: 50.0
          },
          unit_two.id => {
            total_questions: 1, answered_count: 1, correct_count: 1, progress_rate: 100.0, correct_rate: 100.0
          },
          unit_without_questions.id => {
            total_questions: 0, answered_count: 0, correct_count: 0, progress_rate: 0, correct_rate: nil
          }
        )
      end

      it 'タスク単位では、Unitの件数を合計してから率を出す' do
        expect(result[task_a.id]).to include(
          total_questions: 4, answered_count: 3, correct_count: 2, progress_rate: 75.0, correct_rate: 66.7
        )
      end
    end

    context '同じUnitを持つ別のタスクに解答している場合' do
      before do
        answer!(task: task_a, question: question_one, is_correct: true)
      end

      it '解答はタスクごとに分けて数える' do
        expect(result[task_b.id][:units][unit_one.id]).to include(answered_count: 0, correct_count: 0)
      end
    end

    context 'まだ1問も解答していないタスクの場合' do
      it '件数は0、正答率はnilを返す' do
        expect(result[task_b.id]).to eq(
          total_questions: 3, answered_count: 0, correct_count: 0, progress_rate: 0, correct_rate: nil,
          units: {
            unit_one.id => {
              total_questions: 3, answered_count: 0, correct_count: 0, progress_rate: 0, correct_rate: nil
            }
          }
        )
      end
    end

    context 'Unitが1つも紐づいていないタスクの場合' do
      it '件数は0、正答率はnil、unitsは空で返す' do
        expect(result[task_without_units.id]).to eq(
          total_questions: 0, answered_count: 0, correct_count: 0, progress_rate: 0, correct_rate: nil,
          units: {}
        )
      end
    end

    it '渡したタスクすべてをキーに含む' do
      expect(result.keys).to contain_exactly(task_a.id, task_b.id, task_without_units.id)
    end

    it '他の生徒の解答は数えない' do
      other_user = create(:user)
      answer!(task: task_a, question: question_one, is_correct: true, answerer: other_user)

      expect(result[task_a.id]).to include(answered_count: 0, correct_count: 0)
    end

    context 'tasksが空の場合' do
      let(:tasks) { [] }

      it '空のハッシュを返す' do
        expect(result).to eq({})
      end
    end

    it 'タスク・Unitの数に関係なくクエリは2本(TaskAnswerStatsQueryの2本だけ)' do
      answer!(task: task_a, question: question_one, is_correct: true)
      answer!(task: task_b, question: question_one, is_correct: true)
      service = described_class.new(user: user, tasks: tasks)

      expect(count_queries { service.call }).to eq(2)
    end
  end
end
