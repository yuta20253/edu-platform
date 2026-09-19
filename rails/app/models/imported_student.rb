# frozen_string_literal: true

# == Schema Information
#
# Table name: imported_students
#
#  id                :bigint           not null, primary key
#  import_history_id :bigint           not null
#  user_id           :bigint           not null
#  action            :integer          not null
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#
class ImportedStudent < ApplicationRecord
  belongs_to :import_history
  belongs_to :user

  enum :action, {
    created: 0,
    updated: 1
  }, validate: true
end
