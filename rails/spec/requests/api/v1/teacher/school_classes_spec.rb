# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Teacher::SchoolClasses', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  let!(:high_school) { create(:high_school) }
  let!(:teacher) { create(:user, :teacher, high_school: high_school) }
  let(:cookie) { login_and_get_cookie(teacher) }

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: {
           email: user.email,
           password: 'password'
         }.to_json,
         headers: headers

    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/teacher/school_classes' do
    let!(:grade) { create(:grade, high_school: high_school) }
    let!(:school_class) { create(:school_class, grade: grade, name: '1組') }

    context '認証済みの場合' do
      it '200が返る' do
        get '/api/v1/teacher/school_classes', headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it '所属高校の学年配下のクラスが返る' do
        get '/api/v1/teacher/school_classes', headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body
        grade_json = json.find { |g| g['id'] == grade.id }

        expect(grade_json['school_classes'].pluck('name')).to include('1組')
      end

      it '他高校のクラスは含まれない' do
        other_high_school = create(:high_school)
        other_grade = create(:grade, high_school: other_high_school)
        create(:school_class, grade: other_grade, name: '他校クラス')

        get '/api/v1/teacher/school_classes', headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body
        grade_ids = json.pluck('id')

        expect(grade_ids).not_to include(other_grade.id)
      end
    end

    context '未認証の場合' do
      it 'アクセスできない' do
        get '/api/v1/teacher/school_classes', headers: headers

        expect(response).not_to have_http_status(:ok)
      end
    end
  end

  describe 'GET /api/v1/teacher/school_classes/:id' do
    let!(:grade) { create(:grade, high_school: high_school) }
    let!(:school_class) { create(:school_class, grade: grade, name: '1組') }

    context '認証済みの場合' do
      it '200が返る' do
        get "/api/v1/teacher/school_classes/#{school_class.id}", headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it 'クラス情報が返る' do
        get "/api/v1/teacher/school_classes/#{school_class.id}", headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['name']).to eq('1組')
      end
    end

    context '他高校のクラスの場合' do
      let!(:other_high_school) { create(:high_school) }
      let!(:other_grade) { create(:grade, high_school: other_high_school) }
      let!(:other_school_class) { create(:school_class, grade: other_grade, name: '他校クラス') }

      it '404が返る' do
        get "/api/v1/teacher/school_classes/#{other_school_class.id}", headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end
    end

    context '存在しないクラスの場合' do
      it '404が返る' do
        get '/api/v1/teacher/school_classes/999999', headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end
    end

    context '未認証の場合' do
      it 'アクセスできない' do
        get "/api/v1/teacher/school_classes/#{school_class.id}", headers: headers

        expect(response).not_to have_http_status(:ok)
      end
    end
  end
end
