require 'rails_helper'

RSpec.describe ProfileUpdateForm, type: :model do
  let!(:user) { create(:user) }

  let(:params) do
    {
      name: '田中 太郎',
      name_kana: 'タナカ タロウ',
      address_id: 1,
      birthday: Date.new(2000, 1, 1),
      gender: 'male',
      phone_number: '08012345678'
    }
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
        expect(user.address_id).to eq 1

        info = user.user_personal_info
        expect(info.birthday).to eq Date.new(2000, 1, 1)
        expect(info.gender).to eq 'male'
        expect(info.phone_number).to eq '08012345678'

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

    context '誕生日が未来日のとき' do
      it '保存できない' do
        form = described_class.new(params.merge(birthday: Date.new(2030, 1, 1)))
        form.user = user

        expect(form.save).to be false
        expect(form.errors[:birthday]).to include('は未来日付にできません。')
      end
    end
  end
end
