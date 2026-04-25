# frozen_string_literal: true

module Student
  class CreateQuestionHistoryForm
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

      return false unless prepare_context

      QuestionHistory.create!(
        user: @current_user,
        course: @course,
        unit: @unit,
        question: @question,
        question_choice_id: question_choice_id,
        answer_text: answer_text,
        time_spent_sec: time_spent_sec,
        is_correct: is_correct,
        explanation_viewed: explanation_viewed
      )

      true
    end

    private

    def prepare_context
      task = @current_user.tasks.find_by(id: task_id)
      return false unless task

      @unit = task.units.find_by(id: unit_id)
      return false unless @unit

      @course = @unit.course

      @question = @unit.questions.find_by(id: question_id)
      return false unless @question

      true
    end
  end
end
