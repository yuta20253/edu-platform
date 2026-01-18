class CreateUserPersonalInfos < ActiveRecord::Migration[7.1]
  def change
    create_table :user_personal_infos do |t|
      t.references :user, null: false, foreign_key: true
      t.string :phone_number
      t.date :birthday
      t.integer :gender
      t.datetime :deleted_at

      t.timestamps
    end
  end
end
