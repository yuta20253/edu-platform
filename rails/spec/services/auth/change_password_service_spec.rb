# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auth::ChangePasswordService do
  describe '#call' do
    let(:user) { create(:user) }

    context 'tokenが有効な場合' do
      let(:raw_token) { user.send_reset_password_instructions }
      let(:form) do
        Auth::PasswordResetForm.new(
          reset_password_token: raw_token,
          password: 'newpassword',
          password_confirmation: 'newpassword'
        )
      end

      it 'パスワードを更新できる' do
        service = described_class.new(form)
        expect(service.call).to eq 'パスワードを更新しました。'
      end
    end

    context 'tokenが無効な場合' do
      let(:form) do
        Auth::PasswordResetForm.new(
          reset_password_token: 'invalid',
          password: 'newpassword',
          password_confirmation: 'newpassword'
        )
      end

      it 'ValidationErrorをraiseする' do
        service = described_class.new(form)
        expect { service.call }.to raise_error(ValidationError)
      end
    end

    context 'teacherの場合' do
      let(:teacher_role) { create(:user_role, name: :teacher) }
      let(:user) do
        create(
          :user,
          :invitation_pending,
          user_role: teacher_role
        )
      end

      let(:raw_token) { user.send_reset_password_instructions }

      let(:form) do
        Auth::PasswordResetForm.new(
          reset_password_token: raw_token,
          password: 'newpassword',
          password_confirmation: 'newpassword'
        )
      end

      it 'password_reset_requiredがfalseになる' do
        described_class.new(form).call

        expect(user.reload.password_reset_required).to be(false)
      end
    end

    context 'teacher以外の場合' do
      let(:user) { create(:user, password_reset_required: true) }

      let(:raw_token) { user.send_reset_password_instructions }

      let(:form) do
        Auth::PasswordResetForm.new(
          reset_password_token: raw_token,
          password: 'newpassword',
          password_confirmation: 'newpassword'
        )
      end

      it 'password_reset_requiredは変更されない' do
        described_class.new(form).call

        expect(user.reload.password_reset_required).to be(true)
      end
    end
  end
end
