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

      it '権限のlock_versionが permission_lock_version で返される' do
        teacher.teacher_permission.update!(manage_other_teachers: true)

        subject

        teacher_data = response.parsed_body['teachers'].first
        expect(teacher_data['permission_lock_version']).to eq(teacher.teacher_permission.reload.lock_version)
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
    let!(:grade)      { create(:grade, high_school: school, year: 1) }
    let(:cookie)      { login_and_get_cookie(admin_user) }

    let(:valid_params) do
      {
        name: '田中太郎',
        email: 'tanaka@example.com',
        grade_scope: 'own_grade',
        manage_other_teachers: false,
        grade_ids: [grade.id]
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

      it '作成した teacher オブジェクトが指定した項目で返される' do
        subject
        teacher_data = response.parsed_body['teacher']
        expect(teacher_data.keys).to include('id', 'name', 'email', 'grade_scope', 'manage_other_teachers', 'grades')
        expect(teacher_data['name']).to eq('田中太郎')
        expect(teacher_data['email']).to eq('tanaka@example.com')
        expect(teacher_data['grade_scope']).to eq('own_grade')
        expect(teacher_data['manage_other_teachers']).to be(false)
      end

      it '招待メールが送信される' do
        allow(AuthMailer).to receive(:invite_user).and_call_original
        subject
        expect(AuthMailer).to have_received(:invite_user)
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

    context '異常系 - grade_scope が不正な値' do
      let(:invalid_params) do
        {
          name: '田中太郎',
          email: 'tanaka@example.com',
          grade_scope: 'invalid_scope',
          manage_other_teachers: false,
          grade_ids: [grade.id]
        }.to_json
      end

      it '500ではなく422が返される' do
        post "/api/v1/admin/high_schools/#{school.id}/teachers",
             params: invalid_params,
             headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:unprocessable_content)
      end

      it 'errors キーが含まれる' do
        post "/api/v1/admin/high_schools/#{school.id}/teachers",
             params: invalid_params,
             headers: headers.merge('Cookie' => cookie)
        expect(response.parsed_body).to have_key('errors')
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
        name: '更新太郎',
        email: 'updated@example.com',
        grade_scope: 'all_grades',
        manage_other_teachers: true,
        grade_ids: [grade1.id, grade2.id],
        permission_lock_version: teacher.teacher_permission.lock_version
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
        expect(teacher_data['manage_other_teachers']).to be(true)
      end

      it '更新後の権限のlock_versionが permission_lock_version で返される' do
        subject
        expect(response.parsed_body.dig('teacher', 'permission_lock_version'))
          .to eq(teacher.teacher_permission.reload.lock_version)
      end
    end

    context '楽観ロック' do
      subject do
        patch "/api/v1/admin/high_schools/#{school.id}/teachers/#{teacher.id}",
              params: params.to_json,
              headers: headers.merge('Cookie' => cookie)
      end

      let(:permission) { teacher.teacher_permission }

      context 'permission_lock_versionが最新で、権限を変える場合' do
        let(:params) do
          {
            name: teacher.name,
            email: teacher.email,
            grade_scope: 'all_grades',
            manage_other_teachers: true,
            grade_ids: [grade1.id],
            permission_lock_version: permission.lock_version
          }
        end

        it '200で更新され、lock_versionが1増えること' do
          expect { subject }.to change { permission.reload.lock_version }.by(1)

          expect(response).to have_http_status(:ok)
          expect(permission.reload.manage_other_teachers).to be(true)
        end
      end

      context 'permission_lock_versionが最新で、名前だけを変える場合' do
        let(:params) do
          {
            name: '更新太郎',
            email: teacher.email,
            grade_scope: 'own_grade',
            manage_other_teachers: false,
            grade_ids: [grade1.id],
            permission_lock_version: permission.lock_version
          }
        end

        it '200で名前が更新され、lock_versionが増えないこと' do
          expect { subject }.not_to(change { permission.reload.lock_version })

          expect(response).to have_http_status(:ok)
          expect(teacher.reload.name).to eq('更新太郎')
        end
      end

      context 'permission_lock_versionが古く、名前だけを変える場合' do
        let!(:stale_lock_version) { permission.lock_version }
        let!(:original_name) { teacher.name }

        # 権限は開いた時点の古い値を送る
        let(:params) do
          {
            name: '更新太郎',
            email: teacher.email,
            grade_scope: 'own_grade',
            manage_other_teachers: false,
            grade_ids: [grade1.id],
            permission_lock_version: stale_lock_version
          }
        end

        # 開いた後に、教員の画面で権限が変更された
        before { permission.update!(manage_other_teachers: true) }

        it '409になり、名前も権限も変わらないこと' do
          subject

          expect(response).to have_http_status(:conflict)
          expect(teacher.reload.name).to eq(original_name)
          expect(permission.reload.manage_other_teachers).to be(true)
        end
      end

      context 'permission_lock_versionが古く、権限を今と同じ値で送る場合' do
        let!(:stale_lock_version) { permission.lock_version }

        let(:params) do
          {
            name: teacher.name,
            email: teacher.email,
            grade_scope: 'own_grade',
            manage_other_teachers: true,
            grade_ids: [grade1.id],
            permission_lock_version: stale_lock_version
          }
        end

        before { permission.update!(manage_other_teachers: true) }

        it '409になること' do
          subject

          expect(response).to have_http_status(:conflict)
        end
      end

      context 'permission_lock_versionを送らない場合' do
        let!(:original_name) { teacher.name }

        let(:params) do
          {
            name: '更新太郎',
            email: teacher.email,
            grade_scope: 'all_grades',
            manage_other_teachers: true,
            grade_ids: [grade1.id]
          }
        end

        it '422になり、名前も権限も変わらないこと' do
          subject

          expect(response).to have_http_status(:unprocessable_content)
          expect(response.parsed_body['errors']).to include('lock_versionは必須です')
          expect(teacher.reload.name).to eq(original_name)
          expect(permission.reload.manage_other_teachers).to be(false)
        end
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

    context '異常系 - grade_scope が不正な値' do
      let(:invalid_params) do
        {
          name: '更新太郎',
          email: 'updated@example.com',
          grade_scope: 'invalid_scope',
          manage_other_teachers: true,
          grade_ids: [grade1.id, grade2.id]
        }.to_json
      end

      it '500ではなく422が返される' do
        patch "/api/v1/admin/high_schools/#{school.id}/teachers/#{teacher.id}",
              params: invalid_params,
              headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:unprocessable_content)
      end

      it 'errors キーが含まれる' do
        patch "/api/v1/admin/high_schools/#{school.id}/teachers/#{teacher.id}",
              params: invalid_params,
              headers: headers.merge('Cookie' => cookie)
        expect(response.parsed_body).to have_key('errors')
      end
    end

    context '異常系 - 対象教師が存在しない' do
      it '404が返される' do
        patch "/api/v1/admin/high_schools/#{school.id}/teachers/0",
              params: valid_params,
              headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:not_found)
      end

      it 'permission_lock_versionが無くても、422ではなく404が返される' do
        patch "/api/v1/admin/high_schools/#{school.id}/teachers/0",
              params: { name: '更新太郎' }.to_json,
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
