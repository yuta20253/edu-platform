# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auth::LoginForm, type: :model do
  describe 'バリデーション' do
    it '正しいemailとpasswordがあれば有効' do
      form = described_class.new(email: 'test@example.com', password: 'password')

      expect(form).to be_valid
    end

    it 'emailが不正な形式だと無効' do
      form = described_class.new(email: 'invalid-email', password: 'password')

      expect(form).to be_invalid
      expect(form.errors[:email]).to be_present
    end

    it 'emailが未入力だと無効' do
      form = described_class.new(email: '', password: 'password')

      expect(form).to be_invalid
      expect(form.errors[:email]).to be_present
    end

    it 'passwordが未入力だと無効' do
      form = described_class.new(email: 'test@example.com', password: '')

      expect(form).to be_invalid
      expect(form.errors[:password]).to be_present
    end
  end
end
