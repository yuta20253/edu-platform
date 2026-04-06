# frozen_string_literal: true

# == Schema Information
#
# Table name: import_histories
#
#  id            :bigint           not null, primary key
#  user_id       :bigint           not null
#  unit_id       :bigint           not null
#  file_name     :string(255)      not null
#  file_size     :bigint
#  content_type  :string(255)
#  status        :integer          default("pending"), not null
#  total_count   :integer          default(0), not null
#  success_count :integer          default(0), not null
#  error_count   :integer          default(0), not null
#  started_at    :datetime
#  finished_at   :datetime
#  deleted_at    :datetime
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
class ImportHistorySerializer < ActiveModel::Serializer
  attributes :id, :file_name, :status, :success_count, :error_count, :total_count, :created_at
end
