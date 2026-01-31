# frozen_string_literal: true

require 'csv'

csv_file_path = Rails.root.join('lib/csv/questions/bunkei_level1.csv')

CSV.foreach(csv_file_path, headers: true, encoding: 'bom|utf-8') do |row|
  ActiveRecord::Base.transaction do
    question = Question.find_or_create_by!(
      unit_id: 1,
      question_text: row[0],
      correct_answer: row[5].to_i
    )

    QuestionExplanation.create!(
      question_id: question.id,
      explanation_type: '基本解説',
      explanation_text: row[8]
    )

    (6..7).each_with_index do |i, index|
      next if row[i].blank?

      QuestionHint.create!(
        question_id: question.id,
        step_number: index + 1,
        hint_text: row[i]
      )
    end

    (1..4).each do |i|
      QuestionChoice.create!(
        question_id: question.id,
        choice_number: i,
        choice_text: row[i]
      )
    end
  end
rescue ActiveRecord::RecordInvalid => e
  Rails.logger.error "問題の取り込みに失敗しました: #{row[0]} / #{e.message}"
end
