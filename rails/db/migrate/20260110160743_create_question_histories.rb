class CreateQuestionHistories < ActiveRecord::Migration[7.1]
  def change
    create_table :question_histories do |t|
      t.references :user, null: false, foreign_key: true
      t.references :course, null: false, foreign_key: true
      t.references :unit, null: false, foreign_key: true
      t.references :question, null: false, foreign_key: tru
      e
      t.references :question_choice, null: false, foreign_key: true
      t.text :answer_text, null: true
      t.integer :time_spent_sec
      t.boolean :is_correct, null: false, default: false
      t.boolean :explanation_viewed, null: false, default: false
      t.datetime :answered_at, null: false
      t.datetime :deleted_at

      t.timestamps
    end
    add_index :question_histories, [:user_id, :answered_at]
    add_index :question_histories, [:user_id, :course_id]
    add_index :question_histories, [:user_id, :question_id]
    add_index :question_histories, [:user_id, :is_correct]
  end
end
