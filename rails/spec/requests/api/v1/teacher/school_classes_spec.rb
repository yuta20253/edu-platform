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

      it '所属学年の情報が返る' do
        get "/api/v1/teacher/school_classes/#{school_class.id}", headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['grade']).to include('id' => grade.id, 'display_name' => grade.display_name)
      end

      it '在籍生徒・担任がいない場合は空配列が返る' do
        get "/api/v1/teacher/school_classes/#{school_class.id}", headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['teachers']).to eq([])
        expect(json['students']).to eq([])
      end
    end

    context '担任がいる場合' do
      let!(:homeroom_teacher) do
        create(:user, :teacher, high_school: high_school, name: '山田太郎')
      end

      before do
        create(:teacher_school_class, user: homeroom_teacher, school_class: school_class, role: :homeroom)
      end

      it '担任がroleつきで返る' do
        get "/api/v1/teacher/school_classes/#{school_class.id}", headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['teachers']).to contain_exactly(
          { 'id' => homeroom_teacher.id, 'name' => '山田太郎', 'role' => 'homeroom' }
        )
      end
    end

    context '副担任がいる場合' do
      let!(:assistant_teacher) do
        create(:user, :teacher, high_school: high_school, name: '佐藤次郎')
      end

      before do
        create(:teacher_school_class, user: assistant_teacher, school_class: school_class, role: :assistant)
      end

      it '副担任がroleつきで返る' do
        get "/api/v1/teacher/school_classes/#{school_class.id}", headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['teachers']).to contain_exactly(
          { 'id' => assistant_teacher.id, 'name' => '佐藤次郎', 'role' => 'assistant' }
        )
      end
    end

    context '在籍生徒が複数いる場合' do
      let!(:student_b) do
        create(:user, :student, high_school: high_school, grade: grade, school_class: school_class,
                                name: 'ベータ', name_kana: 'ベータ')
      end
      let!(:student_a) do
        create(:user, :student, high_school: high_school, grade: grade, school_class: school_class,
                                name: 'アルファ', name_kana: 'アルファ')
      end

      it 'name_kana昇順で返る' do
        get "/api/v1/teacher/school_classes/#{school_class.id}", headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['students'].pluck('id')).to eq([student_a.id, student_b.id])
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
