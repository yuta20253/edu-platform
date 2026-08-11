class CreateSchoolClassRequests < ActiveRecord::Migration[7.2]
  def change
    create_table :school_class_requests do |t|
      t.references :school_class, null: true, foreign_key: true
      t.references :applicant, null: false, foreign_key: { to_table: :users }
      t.references :approver, null: true, foreign_key: { to_table: :users }
      t.references :grade, null: false, foreign_key: true
      t.integer :action, null: false
      t.integer :status, null: false, default: 0
      t.string :name
      t.datetime :approved_at
      t.datetime :cancelled_at

      t.timestamps
    end
  end
end
