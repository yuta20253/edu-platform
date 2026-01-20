# frozen_string_literal: true

# == Schema Information
#
# Table name: question_hints
#
#  id          :bigint           not null, primary key
#  question_id :bigint           not null
#  step_number :integer
#  hint_text   :text(65535)
#  deleted_at  :datetime
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
class QuestionHint < ApplicationRecord
  belongs_to :question
end
