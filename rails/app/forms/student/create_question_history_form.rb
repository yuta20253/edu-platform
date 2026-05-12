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
    attribute :explanation_viewed, :boolean

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

      return false unless prepare_context

      result = ::Student::QuestionAnswerJudgeService.new(
        question: @question,
        question_choice_id: question_choice_id
      ).call

      QuestionHistory.create!(
        user: @current_user,
        task: @task,
        course: @course,
        unit: @unit,
        question: @question,
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

    def prepare_context
      @task = @current_user.tasks.find_by(id: task_id)
      return errors.add(:task_id, 'が不正です') && false unless @task

      @unit = @task.units.find_by(id: unit_id)
      return errors.add(:unit_id, 'が不正です') && false unless @unit

      @course = @unit.course

      @question = @unit.questions.find_by(id: question_id)
      return errors.add(:question_id, 'が不正です') && false unless @question

      true
    end

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
