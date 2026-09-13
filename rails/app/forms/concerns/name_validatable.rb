# frozen_string_literal: true

module NameValidatable
  extend ActiveSupport::Concern

  KATAKANA_REGEX = /\A[\p{katakana}ー・\s　]+\z/

  included do
    validates :name, presence: true
    validates :name_kana, presence: true, format: {
      with: KATAKANA_REGEX,
      message: 'はカタカナで入力してください'
    }
  end
end
