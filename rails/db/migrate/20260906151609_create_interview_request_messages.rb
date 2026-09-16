class CreateInterviewRequestMessages < ActiveRecord::Migration[7.2]
  def change
    create_table :interview_request_messages do |t|
      t.references :interview_request, null: false, foreign_key: true
      t.references :sender, null: false, foreign_key: { to_table: :users }
      t.text :body, null: false

      t.timestamps
    end
  end
end
