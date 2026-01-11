class CreateReflections < ActiveRecord::Migration[7.1]
  def change
    create_table :reflections do |t|
      t.references :user, null: false, foreign_key: true
      t.references :course, null: false, foreign_key: true
      t.text :note_text, null: false
      t.date :entry_date, null: false
      t.datetime :deleted_at

      t.timestamps
    end
  end
end
