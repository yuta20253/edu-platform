class CreateTeacherNotifications < ActiveRecord::Migration[7.1]
  def change
    create_table :teacher_notifications do |t|
      t.references :sender_user, null: false, foreign_key: { to_table: :users }
      t.references :receiver_user, null: false, foreign_key: { to_table: :users }
      t.string :email, null: false
      t.datetime :sent_at
      t.string :status, null: false, default: "pending"

      t.timestamps
    end
  end
end
