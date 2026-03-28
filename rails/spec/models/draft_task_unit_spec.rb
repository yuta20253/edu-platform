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
require 'rails_helper'

RSpec.describe DraftTaskUnit, type: :model do
  pending "add some examples to (or delete) #{__FILE__}"
end
