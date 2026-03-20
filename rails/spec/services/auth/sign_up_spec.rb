# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auth::SignUpService, type: :service do
  subject { described_class.new(form).call }

  let!(:high_school) { create(:high_school, name: 'テスト高校') }
  let(:high_school_id) { high_school.id }
  let!(:user_role) { create(:user_role, name: :student) }
  let!(:grade) { create(:grade, high_school: high_school, year: 1) }

  let(:form) do
    Auth::SignUpForm.new(
      email: 'test@example.com',
      name: '山田太郎',
      name_kana: 'ヤマダタロウ',
      password: 'password',
      password_confirmation: 'password',
      user_role_name: user_role_name,
      high_school_id: high_school_id,
      grade_id: grade.id
    )
  end

  context '正常系' do
    let(:user_role_name) { 'student' }
    let(:school_name) { 'テスト高校' }

    it 'ユーザーが作成される' do
      expect { subject }.to change(User, :count).by(1)

      user = subject
      expect(user.user_role).to eq(user_role)
      expect(user.high_school.name).to eq(school_name)
    end
  end

  context '異常系' do
    context 'roleが存在しない場合' do
      let(:user_role_name) { 'invalid_role' }
      let(:school_name) { 'テスト高校' }

      it 'SignUpErrorをraiseする' do
        expect { subject }.to raise_error(Auth::SignUpService::SignUpError, '無効なユーザーロールです')
      end
    end

    context 'schoolが存在しない場合' do
      let(:user_role_name) { 'student' }
      let(:high_school_id) { 9999999999999 }

      it 'SignUpErrorをraiseする' do
        expect { subject }.to raise_error(Auth::SignUpService::SignUpError, '学校が見つかりません')
      end
    end
  end
end
