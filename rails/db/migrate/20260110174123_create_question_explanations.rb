class CreateQuestionExplanations < ActiveRecord::Migration[7.1]
  def change
    create_table :question_explanations do |t|
      t.references :question, null: false, foreign_key: true
      t.string :explanation_type
      t.text :explanation_text
      t.datetime :deleted_at

      t.timestamps
    end
    add_index :question_explanations, :explanation_type
  end
end
