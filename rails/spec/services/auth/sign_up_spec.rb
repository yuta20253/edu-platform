require 'rails_helper'

RSpec.describe Auth::SignUpService, type: :service do
  let!(:high_school) { create(:high_school, name: 'テスト高校') }
  let!(:user_role) { create(:user_role, name: :student) }

  let(:form) do
    instance_double(
      'Auth::SignUpForm',
      user_role_name: user_role_name,
      school_name: school_name,
      to_attributes: {
        email: 'test@example.com',
        password: 'password',
        password_confirmation: 'password'
      }
    )
  end

  subject { described_class.new(form).call }

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
      let(:school_name) { '存在しない高校' }

      it 'SignUpErrorをraiseする' do
        expect { subject }. to raise_error(Auth::SignUpService::SignUpError, '学校が見つかりません')
      end
    end
  end

end
