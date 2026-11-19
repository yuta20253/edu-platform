# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auth::PasswordResetForm, type: :model do
  subject { described_class.new(params) }

  let(:params) do
    {
      reset_password_token: 'token123',
      password: 'password',
      password_confirmation: 'password'
    }
  end

  describe '#human_attribute_name' do
    it '項目名が日本語になる' do
      expect(described_class.human_attribute_name(:reset_password_token)).to eq('リセットトークン')
      expect(described_class.human_attribute_name(:password)).to eq('新しいパスワード')
      expect(described_class.human_attribute_name(:password_confirmation)).to eq('新しいパスワード（確認）')
    end
  end

  describe 'バリデーション' do
    it 'すべての値があれば有効' do
      expect(subject).to be_valid
    end

    it 'reset_password_tokenがなければ無効' do
      subject.reset_password_token = nil
      expect(subject).not_to be_valid
      expect(subject.errors[:reset_password_token]).to be_present
    end

    it 'passwordがなければ無効' do
      subject.password = nil
      expect(subject).not_to be_valid
      expect(subject.errors[:password]).to be_present
    end

    it 'password_confirmationがなければ無効' do
      subject.password_confirmation = nil
      expect(subject).not_to be_valid
      expect(subject.errors[:password_confirmation]).to be_present
    end

    it 'passwordとconfirmationが一致しなければ無効' do
      subject.password_confirmation = 'different'
      expect(subject).not_to be_valid
    end

    it 'passwordとconfirmationが一致しない時、エラーメッセージが日本語になる' do
      subject.password_confirmation = 'different'
      subject.valid?

      expect(subject.errors[:password_confirmation]).to include('と一致しません')
    end
  end
end
