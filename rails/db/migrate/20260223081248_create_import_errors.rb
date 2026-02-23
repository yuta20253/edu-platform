class CreateImportErrors < ActiveRecord::Migration[7.1]
  def change
    create_table :import_errors do |t|
      t.references :import_history, null: false, foreign_key: true
      t.integer :row_number, null: false
      t.text :message, null: false

      t.timestamps
    end
  end
end
