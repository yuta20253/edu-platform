# frozen_string_literal: true

# == Schema Information
#
# Table name: reflections
#
#  id         :bigint           not null, primary key
#  user_id    :bigint           not null
#  course_id  :bigint           not null
#  note_text  :text(65535)      not null
#  entry_date :date             not null
#  deleted_at :datetime
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class Reflection < ApplicationRecord
  belongs_to :user
  belongs_to :course
end
