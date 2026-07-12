# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Teacher::Permissions', type: :request do
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
      manage_other_teachers: true
    )
  end

  let!(:same_school_teacher) do
    create(
      :user,
      user_role: teacher_role,
      high_school: high_school
    )
  end

  let!(:same_school_teacher_permission) do
    create(:teacher_permission, user: same_school_teacher)
  end

  let!(:other_school_teacher) do
    create(
      :user,
      user_role: teacher_role,
      high_school: other_high_school
    )
  end

  let!(:other_school_teacher_permission) do
    create(:teacher_permission, user: other_school_teacher)
  end

  let(:params) do
    {
      teacher_permission: {
        grade_scope: 'all_grades',
        manage_other_teachers: true
      }
    }
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

  describe 'GET /api/v1/teacher/permissions' do
    subject do
      get '/api/v1/teacher/permissions',
          headers: headers.merge('Cookie' => cookie)
    end

    it '同じ高校の教員一覧を取得できること' do
      subject

      expect(response).to have_http_status(:ok)

      json = response.parsed_body

      expect(json['teachers'].pluck('id')).to include(login_teacher.id)
      expect(json['teachers'].pluck('id')).to include(same_school_teacher.id)
      expect(json['teachers'].pluck('id')).not_to include(other_school_teacher.id)

      expect(json['current_user']['id']).to eq(login_teacher.id)
      expect(json['meta']).to be_present
    end
  end

  describe 'GET /api/v1/teacher/permissions/:id' do
    subject do
      get "/api/v1/teacher/permissions/#{same_school_teacher.id}",
          headers: headers.merge('Cookie' => cookie)
    end

    it '教員詳細を取得できること' do
      subject

      expect(response).to have_http_status(:ok)

      json = response.parsed_body

      expect(json['id']).to eq(same_school_teacher.id)
    end
  end

  describe 'PATCH /api/v1/teacher/permissions/:id' do
    subject do
      patch "/api/v1/teacher/permissions/#{same_school_teacher.id}",
            params: params.to_json,
            headers: headers.merge('Cookie' => cookie)
    end

    it '権限を更新できること' do
      subject

      expect(response).to have_http_status(:ok)

      expect(
        same_school_teacher.reload.teacher_permission.manage_other_teachers
      ).to be(true)
    end
  end

  context '自分自身を更新する場合' do
    subject do
      patch "/api/v1/teacher/permissions/#{login_teacher.id}",
            params: params.to_json,
            headers: headers.merge('Cookie' => cookie)
    end

    it '更新できないこと' do
      subject

      expect(response).to have_http_status(:unprocessable_content)

      expect(response.parsed_body['errors'])
        .to include('自分自身は更新できません')
    end
  end

  context '他校教員の場合' do
    subject do
      patch "/api/v1/teacher/permissions/#{other_school_teacher.id}",
            params: params.to_json,
            headers: headers.merge('Cookie' => cookie)
    end

    it '404になること' do
      subject

      expect(response).to have_http_status(:not_found)
    end
  end

  context '最後のアクティブ教員を更新する場合' do
    subject do
      patch "/api/v1/teacher/permissions/#{login_teacher.id}",
            params: params.to_json,
            headers: headers.merge('Cookie' => cookie)
    end

    before do
      same_school_teacher.update!(deleted_at: Time.current)
    end

    it '更新できないこと' do
      subject

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['errors'])
        .to include('最後の教員は更新できません')
    end
  end

  context 'grade_scopeが不正な場合' do
    subject do
      patch "/api/v1/teacher/permissions/#{same_school_teacher.id}",
            params: params.to_json,
            headers: headers.merge('Cookie' => cookie)
    end

    let(:params) do
      {
        teacher_permission: {
          grade_scope: 'invalid',
          manage_other_teachers: true
        }
      }
    end

    it '更新できないこと' do
      subject

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['errors']).to be_present
    end
  end

  context 'manage_other_teachersが不正な場合' do
    subject do
      patch "/api/v1/teacher/permissions/#{same_school_teacher.id}",
            params: params.to_json,
            headers: headers.merge('Cookie' => cookie)
    end

    let(:params) do
      {
        teacher_permission: {
          grade_scope: 'all',
          manage_other_teachers: nil
        }
      }
    end

    it '更新できないこと' do
      subject

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['errors']).to be_present
    end
  end
end
