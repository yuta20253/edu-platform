# frozen_string_literal: true

# == Schema Information
#
# Table name: questions
#
#  id             :bigint           not null, primary key
#  unit_id        :bigint           not null
#  question_text  :text(65535)      not null
#  correct_answer :text(65535)      not null
#  deleted_at     :datetime
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#
class Question < ApplicationRecord
  belongs_to :unit
  has_many :question_choices, dependent: :destroy
  has_many :question_histories
  has_many :question_hints, dependent: :destroy
  has_many :question_explanations, dependent: :destroy
end
