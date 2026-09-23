class CreateInterviewRequests < ActiveRecord::Migration[7.2]
  def change
    create_table :interview_requests do |t|
      t.references :student, null: false, foreign_key: { to_table: :users }
      t.references :teacher, null: false, foreign_key: { to_table: :users }
      t.references :initiator, null: false, foreign_key: { to_table: :users }
      t.integer :initiator_role, null: false
      t.integer :status, null: false, default: 0
      t.integer :reason_category
      t.text :reason_detail, null: false
      t.datetime :scheduled_at
      t.datetime :completed_at
      t.datetime :cancelled_at
      t.references :cancelled_by, null: true, foreign_key: { to_table: :users }
      t.text :cancel_reason
      t.integer :lock_version, null: false, default: 0

      t.timestamps
    end

    add_index :interview_requests, [:student_id, :teacher_id, :status],
              name: 'index_interview_requests_on_student_teacher_status'
  end
end
