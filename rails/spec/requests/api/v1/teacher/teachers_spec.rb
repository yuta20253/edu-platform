# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Teacher::Teachers', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end

  let(:cookie) { login_and_get_cookie(login_teacher) }

  let!(:teacher_role) { create(:user_role, name: :teacher) }

  let!(:high_school) { create(:high_school) }
  let!(:other_high_school) { create(:high_school) }

  let!(:grade) do
    create(
      :grade,
      high_school: high_school,
      year: 1
    )
  end

  let!(:other_school_grade) do
    create(
      :grade,
      high_school: other_high_school,
      year: 1
    )
  end

  let!(:login_teacher) do
    create(
      :user,
      user_role: teacher_role,
      high_school: high_school
    )
  end

  let!(:teacher_permission) do
    create(
      :teacher_permission,
      user: login_teacher,
      manage_other_teachers: manage_other_teachers
    )
  end

  let(:manage_other_teachers) { true }

  let!(:same_school_teacher) do
    create(
      :user,
      user_role: teacher_role,
      high_school: high_school,
      name: '同校 教員'
    )
  end

  let!(:same_school_teacher_permission) do
    create(
      :teacher_permission,
      user: same_school_teacher
    )
  end

  let!(:other_school_teacher) do
    create(
      :user,
      user_role: teacher_role,
      high_school: other_high_school,
      name: '他校 教員'
    )
  end

  let!(:other_school_teacher_permission) do
    create(
      :teacher_permission,
      user: other_school_teacher
    )
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

  describe 'GET /api/v1/teacher/colleagues' do
    subject do
      get '/api/v1/teacher/colleagues',
          headers: headers.merge('Cookie' => cookie)
    end

    it '同じ高校の教員一覧を取得できること' do
      subject

      expect(response).to have_http_status(:ok)

      json = response.parsed_body
      names = json.pluck('name')

      expect(names).to include(login_teacher.name)
      expect(names).to include('同校 教員')
      expect(names).not_to include('他校 教員')
    end
  end

  describe 'GET /api/v1/teacher/colleagues/:id' do
    context '同じ高校の教員の場合' do
      subject do
        get "/api/v1/teacher/colleagues/#{same_school_teacher.id}",
            headers: headers.merge('Cookie' => cookie)
      end

      it '詳細取得できること' do
        subject

        expect(response).to have_http_status(:ok)

        json = response.parsed_body

        expect(json['name']).to eq('同校 教員')
      end
    end

    context '他校の教員の場合' do
      subject do
        get "/api/v1/teacher/colleagues/#{other_school_teacher.id}",
            headers: headers.merge('Cookie' => cookie)
      end

      it '404になること' do
        subject

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'POST /api/v1/teacher/colleagues' do
    subject do
      post '/api/v1/teacher/colleagues',
           params: params.to_json,
           headers: headers.merge('Cookie' => cookie)
    end

    let(:params) do
      {
        name: '山田 太郎',
        name_kana: 'ヤマダ タロウ',
        email: 'yamada@example.com',
        grade_id: grade.id,
        grade_scope: 1,
        manage_other_teachers: true
      }
    end

    context '他職員操作権限がある場合' do
      let(:manage_other_teachers) { true }

      it '教員を新規作成できること' do
        expect { subject }.to change(User, :count).by(1)
                                                  .and change(TeacherPermission, :count).by(1)

        expect(response).to have_http_status(:created)

        json = response.parsed_body

        expect(json['message']).to eq('教員の新規作成に成功しました。')

        created_user = User.find_by(email: 'yamada@example.com')

        expect(created_user).to be_present
        expect(created_user.name).to eq('山田 太郎')
        expect(created_user.name_kana).to eq('ヤマダ タロウ')
        expect(created_user.high_school_id).to eq(high_school.id)
        expect(created_user.grade_id).to eq(grade.id)
        expect(created_user.teacher_permission).to be_all_grades
        expect(created_user.teacher_permission.manage_other_teachers).to be(true)
      end
    end

    context '他職員操作権限がない場合' do
      let(:manage_other_teachers) { false }

      it '権限エラーになること' do
        subject

        expect(response).to have_http_status(:ok)

        json = response.parsed_body

        expect(json['errors']).to eq('他職員操作権限がありません')
      end
    end

    context '入力値が不正な場合' do
      let(:params) do
        {
          name: '',
          name_kana: '',
          email: '',
          grade_id: nil,
          grade_scope: nil,
          manage_other_teachers: false
        }
      end

      it '422を返すこと' do
        subject

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context 'emailが重複している場合' do
      let(:params) do
        {
          name: '山田 太郎',
          name_kana: 'ヤマダ タロウ',
          email: login_teacher.email,
          grade_id: grade.id,
          grade_scope: 1,
          manage_other_teachers: false
        }
      end

      it '422を返すこと' do
        subject

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context 'grade_scopeが不正な場合' do
      let(:params) do
        {
          name: '山田 太郎',
          name_kana: 'ヤマダ タロウ',
          email: 'test@example.com',
          grade_id: grade.id,
          grade_scope: 999,
          manage_other_teachers: false
        }
      end

      it '422を返すこと' do
        subject

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context 'grade_idが未指定の場合' do
      let(:params) do
        {
          name: '山田 太郎',
          name_kana: 'ヤマダ タロウ',
          email: 'test@example.com',
          grade_id: nil,
          grade_scope: 1,
          manage_other_teachers: false
        }
      end

      it '422を返すこと' do
        subject

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '他校のgrade_idを指定した場合' do
      let(:params) do
        {
          name: '山田 太郎',
          name_kana: 'ヤマダ タロウ',
          email: 'test@example.com',
          grade_id: other_school_grade.id,
          grade_scope: 1,
          manage_other_teachers: false
        }
      end

      it '422を返すこと' do
        subject

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context 'name_kanaがひらがなの場合' do
      let(:params) do
        {
          name: '山田 太郎',
          name_kana: 'やまだ たろう',
          email: 'test@example.com',
          grade_id: grade.id,
          grade_scope: 1,
          manage_other_teachers: false
        }
      end

      it '422を返すこと' do
        subject

        expect(response).to have_http_status(:unprocessable_content)
      end
    end
  end
end
