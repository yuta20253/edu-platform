# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ImportedStudent, type: :model do
  describe 'action enum' do
    it 'created / updated を持つ' do
      expect(described_class.actions.keys).to contain_exactly('created', 'updated')
    end

    it '不正な action は validation で弾かれる' do
      imported_student = build(:imported_student)
      imported_student.action = 'invalid_action'

      expect(imported_student).not_to be_valid
      expect(imported_student.errors[:action]).to be_present
    end
  end

  describe '#import_history' do
    it '紐づく import_history を返す' do
      history = create(:import_history)
      imported_student = create(:imported_student, import_history: history)

      expect(imported_student.import_history).to eq(history)
    end
  end

  describe '#user' do
    it '紐づく user を返す' do
      user = create(:user)
      imported_student = create(:imported_student, user: user)

      expect(imported_student.user).to eq(user)
    end
  end
end
