# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TaskAnswerStatsQuery, type: :model do
  subject(:query) { described_class.new(user: user, task_ids: task_ids) }

  let!(:user) { create(:user) }
  let!(:goal) { create(:goal, user: user) }
  let!(:task_a) { create(:task, user: user, goal: goal) }
  let!(:task_b) { create(:task, user: user, goal: goal) }
  let!(:task_not_targeted) { create(:task, user: user, goal: goal) }
  let(:task_ids) { [task_a.id, task_b.id] }

  let!(:course) { create(:course) }
  let!(:unit_one) { create(:unit, course: course) }
  let!(:unit_two) { create(:unit, course: course) }
  let!(:unit_not_targeted) { create(:unit, course: course) }

  let!(:question_one) { create(:question, unit: unit_one) }
  let!(:question_two) { create(:question, unit: unit_one) }
  let!(:question_three) { create(:question, unit: unit_one) }
  let!(:question_four) { create(:question, unit: unit_two) }
  let!(:question_not_targeted) { create(:question, unit: unit_not_targeted) }

  before do
    create(:task_unit, task: task_a, unit: unit_one)
    create(:task_unit, task: task_a, unit: unit_two)
    create(:task_unit, task: task_b, unit: unit_one)
    create(:task_unit, task: task_not_targeted, unit: unit_not_targeted)
  end

  describe '#answer_counts' do
    context '解答履歴がある場合' do
      before do
        create_answer!(user: user, task: task_a, question: question_one, is_correct: true)
        create_answer!(user: user, task: task_a, question: question_two, is_correct: false)
        create_answer!(user: user, task: task_a, question: question_four, is_correct: true)
        create_answer!(user: user, task: task_b, question: question_one, is_correct: false)
      end

      it 'タスク×Unitごとに解答数と正答数を返す' do
        expect(query.answer_counts).to eq(
          [task_a.id, unit_one.id] => { answered_count: 2, correct_count: 1 },
          [task_a.id, unit_two.id] => { answered_count: 1, correct_count: 1 },
          [task_b.id, unit_one.id] => { answered_count: 1, correct_count: 0 }
        )
      end

      it '解答数・正答数は整数で返す' do
        counts = query.answer_counts[[task_a.id, unit_one.id]]

        expect(counts[:answered_count]).to be_a(Integer)
        expect(counts[:correct_count]).to be_a(Integer)
      end
    end

    it '対象外のタスクの解答履歴は含まない' do
      create_answer!(user: user, task: task_not_targeted, question: question_not_targeted, is_correct: true)

      expect(query.answer_counts).to eq({})
    end

    it '他の生徒の解答履歴は含まない' do
      other_user = create(:user)
      create_answer!(user: other_user, task: task_a, question: question_one, is_correct: true)

      expect(query.answer_counts).to eq({})
    end

    it '論理削除された問題への解答履歴は含まない' do
      create_answer!(user: user, task: task_a, question: question_one, is_correct: true)
      create_answer!(user: user, task: task_a, question: question_two, is_correct: true)
      question_two.update_columns(deleted_at: Time.current)

      expect(query.answer_counts).to eq(
        [task_a.id, unit_one.id] => { answered_count: 1, correct_count: 1 }
      )
    end

    it '論理削除された解答履歴は含まない' do
      create_answer!(user: user, task: task_a, question: question_one, is_correct: true)
      create_answer!(user: user, task: task_a, question: question_two, is_correct: true, deleted_at: Time.current)

      expect(query.answer_counts).to eq(
        [task_a.id, unit_one.id] => { answered_count: 1, correct_count: 1 }
      )
    end

    it '未解答のタスク×Unitはキーごと含まない' do
      create_answer!(user: user, task: task_a, question: question_one, is_correct: true)

      expect(query.answer_counts.keys).to contain_exactly([task_a.id, unit_one.id])
    end

    context 'task_idsが空の場合' do
      let(:task_ids) { [] }

      it '空のハッシュを返す' do
        expect(query.answer_counts).to eq({})
      end
    end

    it 'タスク・Unitの数に関係なくクエリは1本' do
      create_answer!(user: user, task: task_a, question: question_one, is_correct: true)
      create_answer!(user: user, task: task_a, question: question_four, is_correct: true)
      create_answer!(user: user, task: task_b, question: question_one, is_correct: true)

      expect(capture_queries { query.answer_counts }.size).to eq(1)
    end
  end

  describe '#question_counts' do
    it '対象タスクに紐づくUnitごとの問題数を返す(複数タスクで共有するUnitも1つにまとめる)' do
      expect(query.question_counts).to eq(unit_one.id => 3, unit_two.id => 1)
    end

    it '論理削除された問題は数えない' do
      question_three.update_columns(deleted_at: Time.current)

      expect(query.question_counts).to eq(unit_one.id => 2, unit_two.id => 1)
    end

    it '問題が1問もないUnitはキーごと含まない' do
      question_four.update_columns(deleted_at: Time.current)

      expect(query.question_counts).to eq(unit_one.id => 3)
    end

    context 'task_idsが空の場合' do
      let(:task_ids) { [] }

      it '空のハッシュを返す' do
        expect(query.question_counts).to eq({})
      end
    end

    it 'タスク・Unitの数に関係なくクエリは1本' do
      expect(capture_queries { query.question_counts }.size).to eq(1)
    end
  end
end
