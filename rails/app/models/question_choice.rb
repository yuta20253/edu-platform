# == Schema Information
#
# Table name: question_choices
#
#  id            :bigint           not null, primary key
#  question_id   :bigint           not null
#  choice_number :integer
#  choice_text   :text(65535)
#  deleted_at    :datetime
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
class QuestionChoice < ApplicationRecord
  belongs_to :question
  has_many :question_histories
end
