# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CurrentUserSerializer do
  subject(:serialized) do
    JSON.parse(ActiveModelSerializers::SerializableResource.new(user, serializer: described_class).to_json)
  end

  describe 'account_linked' do
    context '生徒コードを持つ生徒の場合' do
      let(:user) { build(:user, :student).tap { |u| u.generate_student_number && u.save! } }

      it 'trueを返す' do
        expect(serialized['account_linked']).to be(true)
      end
    end

    context '生徒コードを持たない生徒の場合' do
      let(:user) { create(:user, :student, student_number: nil) }

      it 'falseを返す' do
        expect(serialized['account_linked']).to be(false)
      end
    end

    context '教員の場合' do
      let(:user) { create(:user, :teacher) }

      it 'nilを返す' do
        expect(serialized['account_linked']).to be_nil
      end
    end

    context '管理者の場合' do
      let(:user) { create(:user, :admin, high_school: nil) }

      it 'nilを返す' do
        expect(serialized['account_linked']).to be_nil
      end
    end
  end
end
