# frozen_string_literal: true

# == Schema Information
#
# Table name: question_histories
#
#  id                 :bigint           not null, primary key
#  user_id            :bigint           not null
#  course_id          :bigint           not null
#  unit_id            :bigint           not null
#  question_id        :bigint           not null
#  question_choice_id :bigint           not null
#  answer_text        :text(65535)
#  time_spent_sec     :integer
#  is_correct         :boolean          default(FALSE), not null
#  explanation_viewed :boolean          default(FALSE), not null
#  answered_at        :datetime         not null
#  deleted_at         :datetime
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  task_id            :bigint           not null
#
require 'rails_helper'

RSpec.describe QuestionHistory, type: :model do
  def create_question_history(**attrs)
    user = create(:user)
    create(:question_history, user: user, task: create(:task, user: user), **attrs)
  end

  describe '.active' do
    it '論理削除されていない解答履歴のみ返す' do
      active_history = create_question_history
      create_question_history(deleted_at: Time.current)

      expect(described_class.active).to contain_exactly(active_history)
    end
  end

  describe '.on_active_questions' do
    it '削除されていない問題への解答履歴を返す' do
      history = create_question_history

      expect(described_class.on_active_questions).to contain_exactly(history)
    end

    it '論理削除された問題への解答履歴は除外する' do
      history = create_question_history
      history.question.update_columns(deleted_at: Time.current)

      expect(described_class.on_active_questions).to be_empty
    end

    it '論理削除された解答履歴は除外する' do
      create_question_history(deleted_at: Time.current)

      expect(described_class.on_active_questions).to be_empty
    end
  end

  describe 'CORRECT_ANSWER_COUNT' do
    it '正解の解答履歴の件数を集計できる' do
      create_question_history(is_correct: true)
      create_question_history(is_correct: true)
      create_question_history(is_correct: false)

      expect(described_class.pick(Arel.sql(described_class::CORRECT_ANSWER_COUNT))).to eq(2)
    end

    it 'GROUP BYと組み合わせてグループごとに集計できる' do
      correct_history = create_question_history(is_correct: true)
      incorrect_history = create_question_history(is_correct: false)

      result = described_class.group(:task_id).pluck(:task_id, Arel.sql(described_class::CORRECT_ANSWER_COUNT)).to_h

      expect(result).to eq(correct_history.task_id => 1, incorrect_history.task_id => 0)
    end
  end

  describe '論理削除された問題・選択肢との関連' do
    let(:user) { create(:user) }
    let!(:history) { create(:question_history, user: user, task: create(:task, user: user)) }

    before do
      history.question.update_columns(deleted_at: Time.current)
      history.question_choice.update_columns(deleted_at: Time.current)
    end

    it '削除済みの問題を参照できる' do
      expect(described_class.find(history.id).question).to be_present
    end

    it '削除済みの選択肢を参照できる' do
      expect(described_class.find(history.id).question_choice).to be_present
    end
  end
end
