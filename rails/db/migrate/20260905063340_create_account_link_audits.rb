class CreateAccountLinkAudits < ActiveRecord::Migration[7.2]
  def change
    create_table :account_link_audits do |t|
      t.references :user, null: false, foreign_key: true
      t.bigint :merged_user_id, null: false
      t.string :student_number, null: false
      t.bigint :high_school_id, null: false
      t.bigint :grade_id, null: false
      t.bigint :school_class_id
      t.string :result, null: false

      t.timestamps
    end
  end
end
