class CreateImportHistories < ActiveRecord::Migration[7.1]
  def change
    create_table :import_histories do |t|
      t.references :user, null: false, foreign_key: true
      t.references :unit, null: false, foreign_key: true
      t.string :file_name, null: false
      t.bigint :file_size
      t.string :content_type
      t.integer :status, null: false, default: 0
      t.integer :toral_count, null: false, default: 0
      t.integer :success_count, null: false, default: 0
      t.integer :error_count, null: false, default: 0
      t.datetime :started_at
      t.datetime :finished_at
      t.datetime :deleted_at

      t.timestamps
    end
  end
end
