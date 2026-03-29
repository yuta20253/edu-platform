class CreateAnnouncements < ActiveRecord::Migration[7.1]
  def change
    create_table :announcements do |t|
      t.string :title, null: false
      t.text :content, null: false

      t.integer :status, null: false, default: 0
      t.datetime :published_at

      t.references :publisher, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end
  end
end
