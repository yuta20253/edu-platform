# frozen_string_literal: true

# == Schema Information
#
# Table name: review_question_choices
#
#  id                 :bigint           not null, primary key
#  review_question_id :bigint           not null
#  choice_number      :integer          not null
#  choice_text        :text(65535)      not null
#  is_correct         :boolean          not null
#  deleted_at         :datetime
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#
class ReviewQuestionChoice < ApplicationRecord
  belongs_to :review_questions
end
