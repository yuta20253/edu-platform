class CreateUserSubjectQuestionStats < ActiveRecord::Migration[7.1]
  def change
    create_table :user_subject_question_stats do |t|
      t.references :user, null: false, foreign_key: true
      t.references :subject, null: false, foreign_key: true
      t.integer :total_questions
      t.integer :correct_questions
      t.integer :total_time_sec
      t.decimal :accuracy_rate
      t.decimal :avg_time_sec

      t.timestamps
    end
    add_index :user_subject_question_stats, [:user_id, :subject_id], unique: true

  end
end
