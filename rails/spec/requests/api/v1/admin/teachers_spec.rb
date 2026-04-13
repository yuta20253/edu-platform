# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Teachers', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: { email: user.email, password: 'password' }.to_json,
         headers: headers
    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/admin/high_schools/:high_school_id/teachers' do
    context '正常系' do
      subject do
        get "/api/v1/admin/high_schools/#{school.id}/teachers",
            headers: headers.merge('Cookie' => cookie)
      end

      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let!(:school)     { create(:high_school) }
      let!(:grade)      { create(:grade, high_school: school, year: 1) }
      let!(:teacher) do
        user = create(:user, :teacher, high_school: school, grade: nil)
        create(:teacher_permission, user: user, grade_scope: :all_grades, manage_other_teachers: false)
        create(:teacher_grade, user: user, grade: grade)
        user
      end
      let(:cookie) { login_and_get_cookie(admin_user) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it 'teachers キーが含まれる' do
        subject
        expect(response.parsed_body).to have_key('teachers')
      end

      it '各教師に必要なフィールドが含まれる' do
        subject
        teacher_data = response.parsed_body['teachers'].first
        expect(teacher_data.keys).to include('id', 'name', 'email', 'grade_scope', 'manage_other_teachers', 'grades')
      end

      it 'grade_scope が文字列で返される' do
        subject
        teacher_data = response.parsed_body['teachers'].first
        expect(teacher_data['grade_scope']).to eq('all_grades')
      end

      it 'grades[].name が display_name で返される' do
        subject
        grade_data = response.parsed_body['teachers'].first['grades'].first
        expect(grade_data['name']).to eq(grade.display_name)
      end

      it '対象高校の教師のみ返される' do
        other_school = create(:high_school)
        create(:user, :teacher, high_school: other_school, grade: nil)
        subject
        ids = response.parsed_body['teachers'].pluck('id')
        expect(ids).to include(teacher.id)
        expect(ids.length).to eq(1)
      end
    end

    context '異常系 - 未認証アクセス' do
      let!(:school) { create(:high_school) }

      it '401が返される' do
        get "/api/v1/admin/high_schools/#{school.id}/teachers", headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 管理者以外のアクセス（生徒）' do
      let!(:student_user) { create(:user) }
      let!(:school)       { create(:high_school) }

      it '403が返される' do
        cookie = login_and_get_cookie(student_user)
        get "/api/v1/admin/high_schools/#{school.id}/teachers",
            headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end

    context '異常系 - 存在しない high_school_id' do
      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let(:cookie) { login_and_get_cookie(admin_user) }

      it '404が返される' do
        get '/api/v1/admin/high_schools/0/teachers',
            headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'POST /api/v1/admin/high_schools/:high_school_id/teachers' do
    let!(:admin_user) { create(:user, :admin, high_school: nil) }
    let!(:school)     { create(:high_school) }
    let(:cookie)      { login_and_get_cookie(admin_user) }

    let(:valid_params) do
      {
        teacher: {
          name: '田中太郎',
          email: 'tanaka@example.com'
        }
      }.to_json
    end

    context '正常系' do
      subject do
        post "/api/v1/admin/high_schools/#{school.id}/teachers",
             params: valid_params,
             headers: headers.merge('Cookie' => cookie)
      end

      it 'ステータス201が返される' do
        subject
        expect(response).to have_http_status(:created)
      end

      it '作成した teacher オブジェクトが返される' do
        subject
        teacher_data = response.parsed_body['teacher']
        expect(teacher_data.keys).to include('id', 'name', 'email', 'grade_scope', 'manage_other_teachers', 'grades')
        expect(teacher_data['name']).to eq('田中太郎')
        expect(teacher_data['email']).to eq('tanaka@example.com')
      end

      it 'User が作成される' do
        expect { subject }.to change(User, :count).by(1)
      end

      it 'TeacherPermission がデフォルト値で作成される' do
        subject
        user = User.find_by(email: 'tanaka@example.com')
        expect(user.teacher_permission).to be_present
        expect(user.teacher_permission.grade_scope).to eq('own_grade')
        expect(user.teacher_permission.manage_other_teachers).to eq(false)
      end
    end

    context '異常系 - email 重複' do
      before { create(:user, :teacher, email: 'tanaka@example.com', high_school: school, grade: nil) }

      it '422が返される' do
        post "/api/v1/admin/high_schools/#{school.id}/teachers",
             params: valid_params,
             headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'errors キーが含まれる' do
        post "/api/v1/admin/high_schools/#{school.id}/teachers",
             params: valid_params,
             headers: headers.merge('Cookie' => cookie)
        expect(response.parsed_body).to have_key('errors')
      end
    end

    context '異常系 - 必須パラメータ欠損 (name なし)' do
      let(:invalid_params) do
        { teacher: { email: 'tanaka@example.com' } }.to_json
      end

      it '422が返される' do
        post "/api/v1/admin/high_schools/#{school.id}/teachers",
             params: invalid_params,
             headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context '異常系 - 未認証アクセス' do
      it '401が返される' do
        post "/api/v1/admin/high_schools/#{school.id}/teachers",
             params: valid_params,
             headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 管理者以外のアクセス（生徒）' do
      let!(:student_user) { create(:user) }

      it '403が返される' do
        student_cookie = login_and_get_cookie(student_user)
        post "/api/v1/admin/high_schools/#{school.id}/teachers",
             params: valid_params,
             headers: headers.merge('Cookie' => student_cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'PATCH /api/v1/admin/high_schools/:high_school_id/teachers/:id' do
    let!(:admin_user) { create(:user, :admin, high_school: nil) }
    let!(:school)     { create(:high_school) }
    let!(:grade1)     { create(:grade, high_school: school, year: 1) }
    let!(:grade2)     { create(:grade, high_school: school, year: 2) }
    let!(:teacher) do
      user = create(:user, :teacher, high_school: school, grade: nil)
      create(:teacher_permission, user: user, grade_scope: :own_grade, manage_other_teachers: false)
      create(:teacher_grade, user: user, grade: grade1)
      user
    end
    let(:cookie) { login_and_get_cookie(admin_user) }

    let(:valid_params) do
      {
        teacher: {
          name: '更新太郎',
          email: 'updated@example.com',
          grade_scope: 'all_grades',
          manage_other_teachers: true,
          grade_ids: [grade1.id, grade2.id]
        }
      }.to_json
    end

    context '正常系' do
      subject do
        patch "/api/v1/admin/high_schools/#{school.id}/teachers/#{teacher.id}",
              params: valid_params,
              headers: headers.merge('Cookie' => cookie)
      end

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it '更新した teacher オブジェクトが返される' do
        subject
        teacher_data = response.parsed_body['teacher']
        expect(teacher_data['name']).to eq('更新太郎')
        expect(teacher_data['email']).to eq('updated@example.com')
        expect(teacher_data['grade_scope']).to eq('all_grades')
        expect(teacher_data['manage_other_teachers']).to eq(true)
      end

      it 'TeacherGrade が差分更新される' do
        subject
        expect(teacher.reload.grades.pluck(:id)).to match_array([grade1.id, grade2.id])
      end
    end

    context '正常系 - grade_ids 省略時は既存 TeacherGrade を保持' do
      let(:params_without_grade_ids) do
        {
          teacher: {
            name: '更新太郎',
            grade_scope: 'all_grades',
            manage_other_teachers: false
          }
        }.to_json
      end

      it '既存の TeacherGrade が変わらない' do
        patch "/api/v1/admin/high_schools/#{school.id}/teachers/#{teacher.id}",
              params: params_without_grade_ids,
              headers: headers.merge('Cookie' => cookie)
        expect(teacher.reload.grades.pluck(:id)).to eq([grade1.id])
      end
    end

    context '正常系 - password + password_confirmation 送信時にパスワードが更新される' do
      let(:password_params) do
        {
          teacher: {
            password: 'newpassword123',
            password_confirmation: 'newpassword123'
          }
        }.to_json
      end

      it '200が返される' do
        patch "/api/v1/admin/high_schools/#{school.id}/teachers/#{teacher.id}",
              params: password_params,
              headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:ok)
      end
    end

    context '異常系 - password のみで password_confirmation なし' do
      let(:invalid_password_params) do
        {
          teacher: {
            password: 'newpassword123'
          }
        }.to_json
      end

      it '422が返される' do
        patch "/api/v1/admin/high_schools/#{school.id}/teachers/#{teacher.id}",
              params: invalid_password_params,
              headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context '異常系 - email 重複' do
      before { create(:user, :teacher, email: 'updated@example.com', high_school: school, grade: nil) }

      it '422が返される' do
        patch "/api/v1/admin/high_schools/#{school.id}/teachers/#{teacher.id}",
              params: valid_params,
              headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context '異常系 - 対象教師が存在しない' do
      it '404が返される' do
        patch "/api/v1/admin/high_schools/#{school.id}/teachers/0",
              params: valid_params,
              headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:not_found)
      end
    end

    context '異常系 - 未認証アクセス' do
      it '401が返される' do
        patch "/api/v1/admin/high_schools/#{school.id}/teachers/#{teacher.id}",
              params: valid_params,
              headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 管理者以外のアクセス（生徒）' do
      let!(:student_user) { create(:user) }

      it '403が返される' do
        student_cookie = login_and_get_cookie(student_user)
        patch "/api/v1/admin/high_schools/#{school.id}/teachers/#{teacher.id}",
              params: valid_params,
              headers: headers.merge('Cookie' => student_cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
