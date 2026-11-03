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
        manage_other_teachers: true,
        lock_version: same_school_teacher_permission.lock_version
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

    it '権限のlock_versionを返すこと' do
      same_school_teacher_permission.update!(manage_other_teachers: true)

      subject

      expect(response.parsed_body.dig('teacher_permission', 'lock_version'))
        .to eq(same_school_teacher_permission.reload.lock_version)
    end

    context '他校教員の場合' do
      subject do
        get "/api/v1/teacher/permissions/#{other_school_teacher.id}",
            headers: headers.merge('Cookie' => cookie)
      end

      it '404になること' do
        subject

        expect(response).to have_http_status(:not_found)
      end
    end

    context '論理削除済みの教員の場合' do
      before { same_school_teacher.update!(deleted_at: Time.current) }

      it '404になること' do
        subject

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'PATCH /api/v1/teacher/permissions/:id の楽観ロック' do
    subject do
      patch "/api/v1/teacher/permissions/#{same_school_teacher.id}",
            params: params.to_json,
            headers: headers.merge('Cookie' => cookie)
    end

    context 'lock_versionが最新で、値を変える場合' do
      it '更新され、lock_versionが1増えること' do
        expect { subject }
          .to change { same_school_teacher_permission.reload.lock_version }.by(1)

        expect(response).to have_http_status(:ok)
        expect(same_school_teacher_permission.reload.manage_other_teachers).to be(true)
      end
    end

    context 'lock_versionが最新で、値を変えない場合' do
      let(:params) do
        {
          teacher_permission: {
            grade_scope: same_school_teacher_permission.grade_scope,
            manage_other_teachers: same_school_teacher_permission.manage_other_teachers,
            lock_version: same_school_teacher_permission.lock_version
          }
        }
      end

      it '200で、lock_versionが増えないこと' do
        expect { subject }
          .not_to(change { same_school_teacher_permission.reload.lock_version })

        expect(response).to have_http_status(:ok)
      end
    end

    context 'lock_versionが古い場合' do
      let!(:stale_lock_version) { same_school_teacher_permission.lock_version }

      let(:params) do
        {
          teacher_permission: {
            grade_scope: 'all_grades',
            manage_other_teachers: true,
            lock_version: stale_lock_version
          }
        }
      end

      # 開いた後に、ほかの人が先に権限を変更した
      before { same_school_teacher_permission.update!(grade_scope: :own_grade) }

      it '409になり、値が変わらないこと' do
        subject

        expect(response).to have_http_status(:conflict)

        same_school_teacher_permission.reload
        expect(same_school_teacher_permission.grade_scope).to eq('own_grade')
        expect(same_school_teacher_permission.manage_other_teachers).to be(false)
      end
    end

    context 'lock_versionが古く、送った値が今の値と同じ場合' do
      let!(:stale_lock_version) { same_school_teacher_permission.lock_version }

      let(:params) do
        {
          teacher_permission: {
            grade_scope: 'own_grade',
            manage_other_teachers: false,
            lock_version: stale_lock_version
          }
        }
      end

      before { same_school_teacher_permission.update!(grade_scope: :own_grade) }

      it '409になること' do
        subject

        expect(response).to have_http_status(:conflict)
      end
    end

    context 'lock_versionを送らない場合' do
      let(:params) do
        {
          teacher_permission: {
            grade_scope: 'all_grades',
            manage_other_teachers: true
          }
        }
      end

      it '422になり、値が変わらないこと' do
        subject

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body['errors']).to include('lock_versionは必須です')
        expect(same_school_teacher_permission.reload.manage_other_teachers).to be(false)
      end
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
      patch "/api/v1/teacher/permissions/#{target_teacher.id}",
            params: params.to_json,
            headers: headers.merge('Cookie' => cookie)
    end

    let!(:target_teacher) do
      create(
        :user,
        user_role: teacher_role,
        high_school: high_school
      )
    end

    let!(:target_teacher_permission) do
      create(:teacher_permission, user: target_teacher)
    end

    before do
      same_school_teacher.update!(deleted_at: Time.current)
      login_teacher.update!(deleted_at: Time.current)
    end

    # login_teacher自身が論理削除されているため、この状態ではJWTが失効し
    # そもそも認証を通過できない(「最後の教員」バリデーションには到達しない)。
    # only_active_teacher?はcurrent_user自身を除外対象に含めていないため、
    # 認証さえ通れば current_user が常に「他のアクティブな教員」として
    # カウントされてしまい、この422は現状本番では到達不能。
    it '本人が論理削除されているため認証エラー(401)になること' do
      subject

      expect(response).to have_http_status(:unauthorized)
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
          manage_other_teachers: true,
          lock_version: same_school_teacher_permission.lock_version
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
          manage_other_teachers: nil,
          lock_version: same_school_teacher_permission.lock_version
        }
      }
    end

    it '更新できないこと' do
      subject

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['errors']).to be_present
    end
  end

  context '他教員を管理する権限がない場合' do
    subject do
      patch "/api/v1/teacher/permissions/#{same_school_teacher.id}",
            params: params.to_json,
            headers: headers.merge('Cookie' => cookie)
    end

    before do
      teacher_permission.update!(manage_other_teachers: false)
    end

    it '更新できないこと' do
      subject

      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['errors'])
        .to include('他教員を編集する権限がありません')
    end
  end
end
