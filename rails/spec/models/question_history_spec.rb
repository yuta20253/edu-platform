# frozen_string_literal: true

require 'rails_helper'

RSpec.describe QuestionHistory, type: :model do
  describe '論理削除された問題・選択肢との関連' do
    let(:user) { create(:user) }
    let!(:history) { create(:question_history, user: user, task: create(:task, user: user)) }

    before do
      history.question.update_columns(deleted_at: Time.current)
      history.question_choice.update_columns(deleted_at: Time.current)
    end

    it '削除済みの問題を参照できる' do
      expect(described_class.find(history.id).question).to be_present
    end

    it '削除済みの選択肢を参照できる' do
      expect(described_class.find(history.id).question_choice).to be_present
    end
  end
end
