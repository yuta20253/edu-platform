class CreateUserUnitQuestionStats < ActiveRecord::Migration[7.1]
  def change
    create_table :user_unit_question_stats do |t|
      t.references :user, null: false, foreign_key: true
      t.references :course, null: false, foreign_key: true
      t.references :unit, null: false, foreign_key: true
      t.integer :total_questions
      t.integer :correct_questions
      t.integer :total_time_sec
      t.decimal :accuracy_rate
      t.decimal :avg_time_sec

      t.timestamps
    end
    # ユーザー × 講座 × 単元 = 1行
    add_index :user_unit_question_stats,
              [:user_id, :course_id, :unit_id],
              unique: true,
              name: "index_user_unit_stats_unique"
  end
end
