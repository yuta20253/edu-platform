class AddUniqueIndexToQuestionExplanations < ActiveRecord::Migration[7.1]
  def change
    # 問題ごとに解説種別を一意にする(論理削除済み行もUNIQUE制約の対象)
    add_index :question_explanations,
              [:question_id, :explanation_type],
              unique: true,
              name: "index_question_explanations_unique_type"
  end
end
