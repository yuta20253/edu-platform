class CreateQuestionHints < ActiveRecord::Migration[7.1]
  def change
    create_table :question_hints do |t|
      t.references :question, null: false, foreign_key: true
      t.integer :step_number
      t.text :hint_text
      t.datetime :deleted_at

      t.timestamps
    end
    # 問題ごとに「ステップ1,2,3…」を一意にする
    add_index :question_hints,
              [:question_id, :step_number],
              unique: true,
              name: "index_question_hints_unique_step"
  end
end
