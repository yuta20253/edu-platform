class CreateStudyLogs < ActiveRecord::Migration[7.1]
  def change
    create_table :study_logs do |t|
      t.references :user, null: false, foreign_key: true
      t.references :task, null: false, foreign_key: true
      t.datetime :started_at, null: false
      t.datetime :ended_at, null: true
      t.integer :duration_minutes, null: true
      t.datetime :deleted_at

      t.timestamps
    end
  end
end
