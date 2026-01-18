class CreateReviewQuestionChoices < ActiveRecord::Migration[7.1]
  def change
    create_table :review_question_choices do |t|
      t.references :review_question, null: false
      t.integer :choice_number, null: false
      t.text :choice_text, null: false
      t.boolean :is_correct, null: false
      t.datetime :deleted_at

      t.timestamps
    end
  end
end
