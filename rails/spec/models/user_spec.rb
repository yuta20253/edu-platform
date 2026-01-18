# frozen_string_literal: true

require 'rails_helper'

RSpec.describe User, type: :model do
  let(:student_role) { create(:user_role, :student) }
  let(:admin_role) { create(:user_role, :admin) }
  let(:teacher_role) { create(:user_role, :teacher) }
  let(:guardian_role) { create(:user_role, :guardian) }
  let(:high_school) { create(:high_school, name: 'テスト高校') }

  describe 'バリデーション' do
    context 'nameとname_kana' do
      it '新規作成時は必須ではない' do
        user = described_class.new(email: 'test@example.com', password: 'password', user_role: student_role,
                                   high_school: high_school)
        expect(user.valid?).to be true
      end

      it '更新時は必須' do
        user = create(:user, email: 'test@example.com', password: 'password', user_role: student_role,
                             high_school: high_school)
        user.name = nil
        user.name_kana = nil

        expect(user.valid?).to be false
        expect(user.errors[:name]).to include("can't be blank")
        expect(user.errors[:name_kana]).to include("can't be blank")
      end
    end

    describe 'user_role' do
      it { is_expected.to validate_presence_of(:user_role) }
    end

    # it '生徒と教員の場合はhigh_schoolは必須'
  end
end
