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
class QuestionHistory < ApplicationRecord

  CORRECT_ANSWER_COUNT = 'SUM(CASE WHEN question_histories.is_correct THEN 1 ELSE 0 END)'

  belongs_to :user
  belongs_to :course
  belongs_to :unit
  # 論理削除済みの問題・選択肢でも履歴は参照できるようdefault_scopeを外す
  belongs_to :question, -> { unscope(where: :deleted_at) }, inverse_of: :question_histories
  belongs_to :task
  belongs_to :question_choice, -> { unscope(where: :deleted_at) }, inverse_of: :question_histories

  scope :active, -> { where(deleted_at: nil) }
  scope :on_active_questions, -> { active.joins(:question).where(questions: { deleted_at: nil }) }
end
