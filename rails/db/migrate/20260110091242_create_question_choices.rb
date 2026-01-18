class CreateQuestionChoices < ActiveRecord::Migration[7.1]
  def change
    create_table :question_choices do |t|
      t.references :question, null: false, foreign_key: true
      t.integer :choice_number, null: true
      t.text :choice_text, null: true
      t.datetime :deleted_at

      t.timestamps
    end
  end
end
