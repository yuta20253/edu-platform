class AddColumnsUnitIdAndStatusToStudyLogs < ActiveRecord::Migration[7.2]
  def change
    add_reference :study_logs, :unit, null: false, foreign_key: true
    add_column :study_logs, :status, :integer, null: false, default: 0
  end
end
