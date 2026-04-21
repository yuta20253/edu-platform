# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Addresses', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end

  let!(:prefecture) { create(:prefecture, name: '東京都') }
  let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }
  let!(:user) { create(:user, high_school: high_school) }

  let!(:tokyo) { prefecture }
  let!(:osaka) { create(:prefecture, name: '大阪府') }

  let!(:shinjuku_address) do
    create(:address, prefecture: tokyo, city: '新宿', town: '西新宿')
  end

  let!(:shibuya_address) do
    create(:address, prefecture: tokyo, city: '渋谷', town: '道玄坂')
  end

  let!(:umeda_address) do
    create(:address, prefecture: osaka, city: '北区', town: '梅田')
  end

  let!(:all_addresses) do
    [shinjuku_address, shibuya_address, umeda_address]
  end

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: { email: user.email, password: 'password' }.to_json,
         headers: headers

    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/addresses' do
    context '認証済みアクセス' do
      let!(:cookie) { login_and_get_cookie(user) }

      it 'prefecture_id未指定なら400が返る' do
        get '/api/v1/addresses',
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:bad_request)
        expect(response.parsed_body['error']).to eq('都道府県は必須です。')
      end

      it '都道府県で絞り込める' do
        get '/api/v1/addresses',
            params: { prefecture_id: tokyo.id },
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)

        json = response.parsed_body
        returned_ids = json.pluck('id')

        expect(returned_ids).to contain_exactly(
          shinjuku_address.id,
          shibuya_address.id
        )
      end

      it '市区町村で部分一致検索できる' do
        get '/api/v1/addresses',
            params: {
              prefecture_id: tokyo.id,
              city: '新'
            },
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)

        json = response.parsed_body

        expect(json.pluck('id')).to eq([shinjuku_address.id])
      end

      it '町名で部分一致検索できる' do
        get '/api/v1/addresses',
            params: {
              prefecture_id: osaka.id,
              town: '梅'
            },
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)

        json = response.parsed_body

        expect(json.pluck('id')).to eq([umeda_address.id])
      end

      it '複数条件で絞り込みできる' do
        get '/api/v1/addresses',
            params: {
              prefecture_id: tokyo.id,
              city: '渋',
              town: '道玄'
            },
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)

        json = response.parsed_body

        expect(json.pluck('id')).to eq([shibuya_address.id])
      end

      it '該当データがない場合は空配列' do
        get '/api/v1/addresses',
            params: {
              prefecture_id: tokyo.id,
              city: '存在しない'
            },
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)

        json = response.parsed_body

        expect(json).to be_empty
      end

      it '空文字パラメータは無視される' do
        get '/api/v1/addresses',
            params: {
              prefecture_id: tokyo.id,
              city: '',
              town: ''
            },
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)

        json = response.parsed_body
        returned_ids = json.pluck('id')

        expect(returned_ids).to contain_exactly(
          shinjuku_address.id,
          shibuya_address.id
        )
      end
    end

    context '未認証アクセス' do
      it '401が返される' do
        get '/api/v1/addresses', headers: headers

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
