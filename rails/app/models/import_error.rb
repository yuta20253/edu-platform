# frozen_string_literal: true

# == Schema Information
#
# Table name: import_errors
#
#  id                :bigint           not null, primary key
#  import_history_id :bigint           not null
#  row_number        :integer          not null
#  message           :text(65535)      not null
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#
class ImportError < ApplicationRecord
  belongs_to :import_history
end
