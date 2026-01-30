# frozen_string_literal: true

# == Schema Information
#
# Table name: task_units
#
#  id         :bigint           not null, primary key
#  task_id    :bigint           not null
#  unit_id    :bigint           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class TaskUnit < ApplicationRecord
  belongs_to :task
  belongs_to :unit
end
