# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::AdminForm, type: :model do
  describe '#save（新規作成）' do
    it 'email があれば admin を作成する' do
      form = described_class.new(name: '新規', email: 'new@example.com')
      expect(form.save).to be(true)
      expect(form.result).to be_a(User)
      expect(form.result.email).to eq('new@example.com')
    end

    it 'email が空だと作成に失敗する' do
      form = described_class.new(name: '新規', email: '')
      expect(form.save).to be(false)
      expect(form.errors[:email]).to be_present
    end
  end

  describe '#save（更新）' do
    let(:address) { create(:address) }
    let!(:user) { create(:user, :admin, high_school: nil, name: '更新前', email: 'before@example.com') }

    it 'name / email / 住所 / 個人情報をまとめて更新する' do
      form = described_class.new(
        user: user,
        name: '更新後',
        email: 'after@example.com',
        address_id: address.id,
        phone_number: '08012345678',
        birthday: Date.new(1999, 1, 1),
        gender: 'male'
      )

      expect(form.save).to be(true)

      user.reload
      expect(user.name).to eq('更新後')
      expect(user.email).to eq('after@example.com')
      expect(user.address_id).to eq(address.id)

      info = user.user_personal_info
      expect(info.phone_number).to eq('08012345678')
      expect(info.birthday).to eq(Date.new(1999, 1, 1))
      expect(info.gender).to eq('male')
    end

    it '個人情報が未入力でも更新できる（招待直後 admin を弾かない）' do
      form = described_class.new(user: user, name: '更新後', email: 'after@example.com')
      expect(form.save).to be(true)
      expect(user.reload.user_personal_info).to be_nil
    end

    it 'name_kana が未設定の admin でも更新できる（admin はカナ不要）' do
      user.update_columns(name_kana: nil)
      form = described_class.new(user: user, name: '更新後', email: 'after@example.com')
      expect(form.save).to be(true)
      expect(user.reload.name).to eq('更新後')
    end

    it '個人情報が全て未入力なら空の user_personal_info を作らない' do
      expect do
        described_class.new(user: user, name: '更新後', email: 'after@example.com').save
      end.not_to change(UserPersonalInfo, :count)
    end

    it '既存の user_personal_info がある場合は更新する' do
      user.create_user_personal_info!(phone_number: '08000000000', gender: 'female')

      form = described_class.new(
        user: user, name: '更新後', email: 'after@example.com',
        phone_number: '09011112222', gender: 'male'
      )
      expect(form.save).to be(true)

      info = user.reload.user_personal_info
      expect(info.phone_number).to eq('09011112222')
      expect(info.gender).to eq('male')
    end

    context 'バリデーション' do
      it 'phone_number が桁数不正だと失敗する' do
        form = described_class.new(user: user, name: '更新後', email: 'after@example.com', phone_number: '123')
        expect(form.save).to be(false)
        expect(form.errors[:phone_number]).to be_present
      end

      it 'gender が enum 外だと失敗する' do
        form = described_class.new(user: user, name: '更新後', email: 'after@example.com', gender: 'unknown')
        expect(form.save).to be(false)
        expect(form.errors[:gender]).to be_present
      end

      it '存在しない address_id だと失敗する' do
        form = described_class.new(user: user, name: '更新後', email: 'after@example.com', address_id: 0)
        expect(form.save).to be(false)
        expect(form.errors[:address_id]).to be_present
      end

      it 'birthday が未来日付だと失敗する' do
        form = described_class.new(
          user: user, name: '更新後', email: 'after@example.com', birthday: Date.tomorrow
        )
        expect(form.save).to be(false)
        expect(form.errors[:birthday]).to be_present
      end
    end
  end
end
