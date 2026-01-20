# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auth::LoginService, type: :service do
  subject { described_class.new(form).call }

  let!(:high_school) { create(:high_school) }
  let!(:user) do
    create(:user, email: 'student@example.com', password: 'password', user_role: create(:user_role, :student),
                  high_school: high_school)
  end
  let(:form) { instance_double(Auth::LoginForm, email: email, password: password) }

  context '正しいメールアドレスとパスワードを渡す' do
    let(:email) { 'student@example.com' }
    let(:password) { 'password' }

    it 'ユーザーが返却される' do
      expect(subject).to eq user
    end
  end

  context 'パスワードが違う場合' do
    let(:email) { 'student@example.com' }
    let(:password) { 'wrong_password' }

    it 'LoginErrorが発生する' do
      expect { subject }.to raise_error(Auth::LoginService::LoginError)
    end
  end

  context 'メールアドレスが違う場合' do
    let(:email) { 'wrong_password' }
    let(:password) { 'password' }

    it 'LoginErrorが発生する' do
      expect { subject }.to raise_error(Auth::LoginService::LoginError)
    end
  end
end
