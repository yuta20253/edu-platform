class AddUniqueIndexToQuestionChoices < ActiveRecord::Migration[7.1]
  def change
    # 問題ごとに選択肢番号を一意にする(論理削除済み行もUNIQUE制約の対象)
    add_index :question_choices,
              [:question_id, :choice_number],
              unique: true,
              name: "index_question_choices_unique_choice_number"
  end
end
