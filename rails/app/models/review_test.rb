# frozen_string_literal: true

# == Schema Information
#
# Table name: review_tests
#
#  id          :bigint           not null, primary key
#  course_id   :bigint           not null
#  text_name   :string(255)      not null
#  description :text(65535)      not null
#  deleted_at  :datetime
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
class ReviewTest < ApplicationRecord
  belongs_to :course
  has_many :review_questions, dependent: :destroy
end
