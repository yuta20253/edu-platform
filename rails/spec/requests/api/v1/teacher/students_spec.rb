# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Teacher::Students', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  let!(:prefecture) { create(:prefecture) }
  let!(:high_school) { create(:high_school, prefecture: prefecture) }
  let!(:teacher) do
    create(:user, :teacher, high_school: high_school)
  end
  let!(:teacher_permission) do
    create(
      :teacher_permission,
      user: teacher,
      grade_scope: :all_grades
    )
  end
  let!(:cookie) { login_and_get_cookie(teacher) }

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: { email: user.email, password: 'password' }.to_json,
         headers: headers

    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/teacher/students' do
    subject do
      get '/api/v1/teacher/students',
          headers: headers.merge('Cookie' => cookie)
    end

    before do
      create_list(:user, 15, :student, high_school: high_school)
    end

    it '200が返る' do
      subject

      expect(response).to have_http_status(:ok)
    end

    it 'studentsが返る' do
      subject

      expect(response.parsed_body).to have_key('students')
    end

    it 'metaが返る' do
      subject

      expect(response.parsed_body).to have_key('meta')
    end

    it 'デフォルトの件数が10件' do
      subject

      expect(response.parsed_body['meta']['per_page']).to eq(10)
      expect(response.parsed_body['students'].size).to eq(10)
    end

    it 'per_pageを指定できる' do
      get '/api/v1/teacher/students',
          params: { per_page: 5 },
          headers: headers.merge('Cookie' => cookie)

      expect(response.parsed_body['meta']['per_page']).to eq(5)
    end
  end

  describe 'POST /api/v1/teacher/students' do
    subject do
      post '/api/v1/teacher/students',
           params: params.to_json,
           headers: headers.merge('Cookie' => cookie)
    end

    let!(:other_high_school) { create(:high_school, prefecture: prefecture) }
    let!(:grade) { create(:grade, high_school: high_school, year: 1) }
    let!(:other_school_grade) { create(:grade, high_school: other_high_school, year: 1) }
    let!(:school_class) { create(:school_class, grade: grade, name: 'A組') }

    let(:params) do
      {
        user: {
          name: '山田 太郎',
          name_kana: 'ヤマダ タロウ',
          email: 'yamada@example.com',
          grade_id: grade.id,
          school_class_id: school_class.id
        }
      }
    end

    context '入力値が正常な場合' do
      it '生徒を新規作成し、201とmessageを返すこと' do
        expect { subject }.to change(User, :count).by(1)
                                                  .and have_enqueued_mail(AuthMailer, :invite_user)

        expect(response).to have_http_status(:created)
        expect(response.parsed_body['message']).to eq('生徒の新規作成に成功しました。')

        student = User.find_by(email: 'yamada@example.com')

        expect(student).to be_present
        expect(student.high_school).to eq(high_school)
        expect(student.grade).to eq(grade)
        expect(student.school_class).to eq(school_class)
        expect(student.student_number).to be_present
      end
    end

    context '他校のgrade_idを指定した場合' do
      let(:params) do
        {
          user: {
            name: '山田 太郎',
            name_kana: 'ヤマダ タロウ',
            email: 'yamada@example.com',
            grade_id: other_school_grade.id,
            school_class_id: school_class.id
          }
        }
      end

      it '422が返り、生徒が作成されないこと' do
        expect { subject }.not_to change(User, :count)

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body['errors']).to be_present
      end
    end

    context 'own_gradeの教員が担当外学年を指定した場合' do
      let!(:teacher_permission) do
        create(:teacher_permission, user: teacher, grade_scope: :own_grade)
      end
      let!(:other_grade) { create(:grade, high_school: high_school, year: 2) }
      let!(:other_grade_school_class) { create(:school_class, grade: other_grade, name: 'A組') }

      let(:params) do
        {
          user: {
            name: '山田 太郎',
            name_kana: 'ヤマダ タロウ',
            email: 'yamada@example.com',
            grade_id: other_grade.id,
            school_class_id: other_grade_school_class.id
          }
        }
      end

      it '422が返り、生徒が作成されないこと' do
        expect { subject }.not_to change(User, :count)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '非教員がAPIを実行した場合' do
      let!(:student) { create(:user, :student, high_school: high_school) }
      let!(:cookie) { login_and_get_cookie(student) }

      it '403が返ること' do
        subject

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
