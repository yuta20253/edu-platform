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
    attribute :is_correct, :boolean
    attribute :explanation_viewed, :boolean

    validates :task_id, presence: true
    validates :unit_id, presence: true
    validates :question_id, presence: true
    validates :question_choice_id, presence: true
    validates :is_correct, inclusion: { in: [true, false] }
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

      question_history.update!(
        question_choice_id: question_choice_id,
        answer_text: answer_text,
        time_spent_sec: time_spent_sec,
        is_correct: is_correct,
        explanation_viewed: explanation_viewed,
        answered_at: Time.current
      )

      true
    end
  end
end
