# frozen_string_literal: true

class AddImportTypeToImportHistories < ActiveRecord::Migration[7.1]
  def change
    change_column_null :import_histories, :unit_id, true
    add_column :import_histories, :import_type, :integer, default: 0, null: false
  end
end
