class CreateReviewQuestions < ActiveRecord::Migration[7.1]
  def change
    create_table :review_questions do |t|
      t.references :review_test, null: false
      t.text :title, null:false
      t.text :correct_answer, null: false
      t.datetime :deleted_at

      t.timestamps
    end
  end
end
