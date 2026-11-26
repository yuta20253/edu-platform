# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ProfileUpdateForm, type: :model do
  let(:params) do
    {
      name: '田中 太郎',
      name_kana: 'タナカ タロウ',
      address_id: address.id,
      birthday: Date.new(2000, 1, 1),
      gender: 'male',
      phone_number: '08012345678'
    }
  end
  let!(:address) { create(:address) }
  let!(:user) { create(:user) }

  describe '#human_attribute_name' do
    it '項目名が日本語になる' do
      expect(described_class.human_attribute_name(:address_id)).to eq('住所')
      expect(described_class.human_attribute_name(:birthday)).to eq('生年月日')
      expect(described_class.human_attribute_name(:gender)).to eq('性別')
      expect(described_class.human_attribute_name(:phone_number)).to eq('電話番号')
    end
  end

  describe '#save' do
    context '正常なパラメータのとき' do
      it 'ユーザーと個人情報が更新される' do
        form = described_class.new(params)
        form.user = user

        expect(form.save).to be true

        user.reload

        expect(user.name).to eq '田中 太郎'
        expect(user.name_kana).to eq 'タナカ タロウ'
        expect(user.address_id).to eq(address.id)

        info = user.user_personal_info
        expect(info.birthday).to eq Date.new(2000, 1, 1)
        expect(info.gender).to eq 'male'
        expect(info.phone_number).to eq '08012345678'
      end
    end

    context 'phone_numberが未入力のとき' do
      it '保存できる' do
        form = described_class.new(params.merge(phone_number: ''))
        form.user = user

        expect(form.save).to be true

        user.reload
        info = user.user_personal_info

        expect(info.phone_number).to eq('')
      end
    end

    context 'nameが空の時' do
      it '保存できない' do
        form = described_class.new(params.merge(name: nil))
        form.user = user

        expect(form.save).to be false
        expect(form.errors[:name]).to be_present
      end
    end

    context 'name_kanaが空の時' do
      it '保存できない' do
        form = described_class.new(params.merge(name_kana: nil))
        form.user = user

        expect(form.save).to be false
        expect(form.errors[:name_kana]).to be_present
      end
    end

    context 'name_kanaがカタカナでない時' do
      it '保存できない' do
        form = described_class.new(params.merge(name_kana: 'たなか たろう'))
        form.user = user

        expect(form.save).to be false
        expect(form.errors[:name_kana]).to include('はカタカナで入力してください')
      end
    end

    context 'phone_numberが不正な形式' do
      it 'phone_numberが9文字の時、保存できない' do
        form = described_class.new(params.merge(phone_number: '123456789'))
        form.user = user

        expect(form.save).to be false
        expect(form.errors[:phone_number]).to be_present
      end

      it 'phone_numberが12文字の時、保存できない' do
        form = described_class.new(params.merge(phone_number: '123456789012'))
        form.user = user

        expect(form.save).to be false
        expect(form.errors[:phone_number]).to be_present
      end
    end

    context '存在しないaddress_idのとき' do
      it '保存できない' do
        form = described_class.new(params.merge(address_id: 9_999_999_999_999))
        form.user = user

        expect(form.save).to be false
        expect(form.errors[:address_id]).to include('が不正です。')
      end
    end

    context '誕生日が未来日のとき' do
      it '保存できない' do
        form = described_class.new(params.merge(birthday: Date.new(2030, 1, 1)))
        form.user = user

        expect(form.save).to be false
        expect(form.errors[:birthday]).to include('は未来日付にできません。')
      end
    end
  end

  describe 'エラーメッセージ' do
    it '氏名の項目名が日本語になる' do
      form = described_class.new(name: '')
      form.valid?

      expect(form.errors.full_messages).to include('氏名 を入力してください')
    end
  end
end
