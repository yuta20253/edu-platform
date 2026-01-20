class CreateQuestions < ActiveRecord::Migration[7.1]
  def change
    create_table :questions do |t|
      t.references :unit, null: false, foreign_key: true
      t.text :question_text, null: false
      t.text :correct_answer, null: false
      t.datetime :deleted_at

      t.timestamps
    end
  end
end
