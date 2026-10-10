# frozen_string_literal: true

# 問題への解答履歴を作る。course・unitは問題から決まり、選択肢は問題ごとに1つを使い回す。
module QuestionAnswerHelper
  def create_answer!(user:, task:, question:, is_correct:, **attrs)
    create(
      :question_history,
      user:,
      task:,
      course: question.unit.course,
      unit: question.unit,
      question:,
      question_choice: question.question_choices.first || create(:question_choice, question:),
      is_correct:,
      **attrs
    )
  end
end

RSpec.configure do |config|
  config.include QuestionAnswerHelper
end
