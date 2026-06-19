# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Addresses', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end

  let!(:admin_user) { create(:user, :admin, high_school: nil) }
  let(:cookie)      { login_and_get_cookie(admin_user) }
  let(:prefecture)  { create(:prefecture) }

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: { email: user.email, password: 'password' }.to_json,
         headers: headers
    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe '認可' do
    it '未認証は401' do
      get '/api/v1/admin/addresses', params: { prefecture_id: 1 }, headers: headers
      expect(response).to have_http_status(:unauthorized)
    end

    it '非admin (student) は403' do
      student = create(:user)
      student_cookie = login_and_get_cookie(student)
      get '/api/v1/admin/addresses',
          params: { prefecture_id: 1 }, headers: headers.merge('Cookie' => student_cookie)
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'GET /api/v1/admin/addresses' do
    it 'prefecture_id が無いと 400' do
      get '/api/v1/admin/addresses', headers: headers.merge('Cookie' => cookie)
      expect(response).to have_http_status(:bad_request)
    end

    it 'prefecture_id で住所一覧を返す' do
      address = create(:address, prefecture: prefecture)
      get '/api/v1/admin/addresses',
          params: { prefecture_id: prefecture.id },
          headers: headers.merge('Cookie' => cookie)

      expect(response).to have_http_status(:ok)
      ids = response.parsed_body.pluck('id')
      expect(ids).to include(address.id)
    end

    it 'city で絞り込める' do
      create(:address, prefecture: prefecture, city: '千代田区')
      create(:address, prefecture: prefecture, city: '港区')
      get '/api/v1/admin/addresses',
          params: { prefecture_id: prefecture.id, city: '港区' },
          headers: headers.merge('Cookie' => cookie)

      cities = response.parsed_body.pluck('city').uniq
      expect(cities).to contain_exactly('港区')
    end
  end
end
