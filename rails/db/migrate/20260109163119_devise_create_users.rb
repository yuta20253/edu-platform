# frozen_string_literal: true

class DeviseCreateUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :users do |t|
      ## Devise (認証)
      t.string :email,              null: false
      t.string :encrypted_password, null: false

      ## Recoverable
      t.string   :reset_password_token
      t.datetime :reset_password_sent_at

      ## Rememberable
      t.datetime :remember_created_at

      ## 業務ユーザー情報
      t.string :name, limit: 100
      t.string :name_kana, limit: 100

      ## 役割
      t.references :user_role, null: false, foreign_key: true

      ## JWT (devise-jwt)
      t.string :jti, null: false

      ## 論理削除
      t.datetime :deleted_at

      t.timestamps
    end

    add_index :users, :email, unique: true
    add_index :users, :reset_password_token, unique: true
    add_index :users, :jti, unique: true
  end
end
