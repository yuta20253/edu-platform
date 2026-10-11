# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Student::Teachers', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  let!(:high_school) { create(:high_school) }
  let!(:grade) { create(:grade, high_school: high_school) }
  let!(:school_class) { create(:school_class, grade: grade) }
  let!(:homeroom_teacher) { create(:user, :teacher, high_school: high_school, name: '担任先生') }
  let!(:other_class_teacher) { create(:user, :teacher, high_school: high_school) }

  before do
    create(:teacher_school_class, user: homeroom_teacher, school_class: school_class, role: :homeroom)
    create(:teacher_school_class, user: other_class_teacher, school_class: create(:school_class, grade: grade))
  end

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: {
           email: user.email,
           password: 'password'
         }.to_json,
         headers: headers

    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/student/teachers' do
    context '学級に所属している生徒の場合' do
      let!(:student) do
        create(:user, :student, high_school: high_school, grade: grade, school_class: school_class)
      end

      it '自分の学級の担当教員のidと名前のみ返る' do
        get '/api/v1/student/teachers', headers: headers.merge('Cookie' => login_and_get_cookie(student))

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body['teachers']).to eq([{ 'id' => homeroom_teacher.id, 'name' => '担任先生' }])
      end
    end

    context '学級に所属していない生徒の場合' do
      let!(:student) { create(:user, :student, high_school: high_school, grade: grade) }

      it '空配列が返る' do
        get '/api/v1/student/teachers', headers: headers.merge('Cookie' => login_and_get_cookie(student))

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body['teachers']).to eq([])
      end
    end

    context '教員がアクセスした場合' do
      it '403が返る' do
        get '/api/v1/student/teachers', headers: headers.merge('Cookie' => login_and_get_cookie(homeroom_teacher))

        expect(response).to have_http_status(:forbidden)
      end
    end

    context '未ログインの場合' do
      it '401が返る' do
        get '/api/v1/student/teachers', headers: headers

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
