class CreateGoals < ActiveRecord::Migration[7.1]
  def change
    create_table :goals do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.text :description
      t.date :due_date
      t.integer :status, null: false, default: 0

      t.datetime :deleted_at

      t.timestamps
    end
  end
end
