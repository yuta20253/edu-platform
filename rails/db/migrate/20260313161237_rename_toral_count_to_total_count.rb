class RenameToralCountToTotalCount < ActiveRecord::Migration[7.1]
  def change
    rename_column :import_histories, :toral_count, :total_count
  end
end
