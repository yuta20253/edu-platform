class AddModeToImportHistories < ActiveRecord::Migration[7.1]
  def change
    add_column :import_histories, :mode, :integer, null: false, default: 0
  end
end
