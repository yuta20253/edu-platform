class CreateReviewTests < ActiveRecord::Migration[7.1]
  def change
    create_table :review_tests do |t|
      t.references :course, null: false
      t.string :text_name, null: false
      t.text :description, null: false
      t.datetime :deleted_at

      t.timestamps
    end
  end
end
