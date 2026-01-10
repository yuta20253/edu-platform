# frozen_string_literal: true

# == Schema Information
#
# Table name: review_questions
#
#  id             :bigint           not null, primary key
#  review_test_id :bigint           not null
#  title          :text(65535)      not null
#  correct_answer :text(65535)      not null
#  deleted_at     :datetime
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#
class ReviewQuestion < ApplicationRecord
  belongs_to :review_test
  has_many :review_question_choices, dependent: :destroy
end
