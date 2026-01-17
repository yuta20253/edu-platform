# frozen_string_literal: true

require 'rails_helper'
require 'devise/jwt/test_helpers'

RSpec.describe 'Api::V1::Registrations', type: :request do
  include Devise::Test::IntegrationHelpers

  describe 'POST /api/v1/student/signup' do
    let!(:student_role) { create(:user_role, :student) }
    let!(:high_school) { create(:high_school) }

    let(:valid_params) do
      {
        user: {
          email: 'student@example.com',
          password: 'password',
          password_confirmation: 'password',
          name: 'テスト太郎',
          name_kana: 'テストタロウ',
          user_role_name: student_role.name,
          school_name: high_school.name
        }
      }
    end

    let(:headers) do
      {
        'Content-Type' => 'application/json',
        'Accept' => 'application/json'
      }
    end

    context '正常系' do
      it '高校生ユーザーが作成できる' do
        expect do
          post '/api/v1/student/signup', params: valid_params.to_json, headers: headers
        end.to change(User, :count).by(1)

        expect(response).to have_http_status(:created)

        user = User.last

        expect(user.user_role.name).to eq('student')
        expect(user.high_school.name).to eq(high_school.name)
      end
    end

    context '異常系' do
      it 'roleが存在しない場合は 404 を返す' do
        invalid_params = valid_params.deep_merge(
          user: { user_role_name: 'not_exist_role' }
        )
        post '/api/v1/student/signup', params: invalid_params.to_json, headers: headers

        expect(response).to have_http_status(:not_found)
      end

      it 'schoolが存在しない場合は404 を返す' do
        invalid_params = valid_params.deep_merge(
          user: { school_name: '存在しない高校' }
        )
        post '/api/v1/student/signup', params: invalid_params.to_json, headers: headers

        expect(response).to have_http_status(:not_found)
      end

      context '必須パラメーター不足' do
        let(:invalid_params) do
          {
            user: {
              email: '',
              password: 'password',
              password_confirmation: 'password',
              name: '',
              name_kana: '',
              user_role_name: student_role.name,
              school_name: high_school.name
            }
          }
        end

        it '422を返す' do
          post '/api/v1/student/signup', params: invalid_params.to_json, headers: headers

          expect(response).to have_http_status(:unprocessable_content)
        end
      end
    end
  end
end
