# frozen_string_literal: true

# == Schema Information
#
# Table name: draft_task_units
#
#  id            :bigint           not null, primary key
#  draft_task_id :bigint           not null
#  unit_id       :bigint           not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
class DraftTaskUnit < ApplicationRecord
  belongs_to :draft_task
  belongs_to :unit
end
