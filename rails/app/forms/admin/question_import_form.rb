# frozen_string_literal: true

module Admin
  class QuestionImportForm
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations

    attribute :question_text, :string
    attribute :correct_answer, :integer

    attribute :explanation_text, :string

    attribute :choices, array: true, default: []
    attribute :hints, array: true, default: []

    validates :question_text, presence: true
    validates :correct_answer, presence: true, inclusion: { in: 1..4 }
    validates :explanation_text, presence: true
    validates :choices, presence: true, length: { is: 4 }
    validates :hints, length: { maximum: 2 }

    # CSVの列名・列順を定義する唯一の場所。
    # テンプレート生成・dry_run検証・実インポートはすべてこの定数を参照すること。
    HEADERS = %w[問題文 正解番号 解説 選択肢1 選択肢2 選択肢3 選択肢4 ヒント1 ヒント2].freeze

    # HEADERSのうちCSVに必須の列(ヒントは任意項目のため含めない)。
    # ヘッダー行の妥当性チェック(Csv::HeaderValidator)で使う。
    REQUIRED_HEADERS = %w[問題文 正解番号 解説 選択肢1 選択肢2 選択肢3 選択肢4].freeze

    def self.from_csv_row(row)
      new(
        question_text: row['問題文'],
        correct_answer: row['正解番号']&.to_i,
        explanation_text: row['解説'],
        choices: [
          row['選択肢1'],
          row['選択肢2'],
          row['選択肢3'],
          row['選択肢4']
        ],
        hints: [
          row['ヒント1'],
          row['ヒント2']
        ].compact_blank
      )
    end
  end
end
