class CreateUserOverallQuestionStats < ActiveRecord::Migration[7.1]
  def change
    create_table :user_overall_question_stats do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.integer :total_questions,  null: false, default: 0
      t.integer :correct_questions, null: false, default: 0
      t.integer :total_time_sec,    null: false, default: 0
      t.decimal :accuracy_rate, precision: 5, scale: 2, null: false, default: 0
      t.decimal :avg_time_sec,  precision: 6, scale: 2, null: false, default: 0

      t.timestamps
    end
  end
end
