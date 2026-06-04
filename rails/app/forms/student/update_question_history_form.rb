# frozen_string_literal: true

module Student
  class UpdateQuestionHistoryForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations

    attribute :task_id, :integer
    attribute :unit_id, :integer
    attribute :question_id, :integer
    attribute :question_choice_id, :integer
    attribute :answer_text, :string
    attribute :time_spent_sec, :integer
    attribute :explanation_viewed, :boolean, default: false

    validates :task_id, presence: true
    validates :unit_id, presence: true
    validates :question_id, presence: true
    validates :question_choice_id, presence: true

    validate :validate_question_choice_relation

    validates :explanation_viewed, inclusion: { in: [true, false] }

    def initialize(current_user:, **attributes)
      super(attributes)
      @current_user = current_user
    end

    def save
      return false unless valid?

      question_history = QuestionHistory.find_by(user: @current_user, task_id: task_id, unit_id: unit_id,
                                                 question_id: question_id)

      unless question_history
        errors.add(:base, '解答履歴が見つかりません')
        return false
      end

      result = ::Student::QuestionAnswerJudgeService.new(
        question: question_history.question,
        question_choice_id: question_choice_id
      ).call

      question_history.update!(
        question_choice_id: question_choice_id,
        answer_text: answer_text,
        time_spent_sec: time_spent_sec,
        is_correct: result[:is_correct],
        explanation_viewed: explanation_viewed,
        answered_at: Time.current
      )

      result
    rescue ActiveRecord::RecordInvalid => e
      errors.add(:base, e.message)
      false
    end

    private

    def validate_question_choice_relation
      return if question_choice_id.blank? || question_id.blank?

      exists = QuestionChoice.exists?(
        id: question_choice_id,
        question_id: question_id
      )

      return if exists

      errors.add(:question_choice_id, 'はこの問題の選択肢ではありません')
    end
  end
end
