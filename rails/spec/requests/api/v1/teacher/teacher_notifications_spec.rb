# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Teacher::TeacherNotifications', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  let!(:pending_teacher1) do
    create(
      :user,
      :invitation_pending,
      user_role: teacher_role,
      high_school: high_school,
      name: '未送信教員1'
    )
  end
  let!(:pending_teacher2) do
    create(
      :user,
      :invitation_pending,
      user_role: teacher_role,
      high_school: high_school,
      name: '未送信教員2'
    )
  end
  let!(:already_sent_teacher) do
    create(
      :user,
      :invitation_completed,
      user_role: teacher_role,
      high_school: high_school,
      name: '送信済み教員'
    )
  end

  let(:cookie) { login_and_get_cookie(login_teacher) }

  let!(:teacher_role) { create(:user_role, name: :teacher) }

  let!(:high_school) { create(:high_school) }

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

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: {
           email: user.email,
           password: 'password'
         }.to_json,
         headers: headers

    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/teacher/teacher_notifications' do
    subject do
      get '/api/v1/teacher/teacher_notifications',
          headers: headers.merge('Cookie' => cookie)
    end

    it '未送信の教員一覧を取得できること' do
      subject

      expect(response).to have_http_status(:ok)

      json = response.parsed_body
      names = json.pluck('name')

      expect(names).to include('未送信教員1')
      expect(names).to include('未送信教員2')
      expect(names).not_to include('送信済み教員')
    end
  end

  describe 'POST /api/v1/teacher/teacher_notifications' do
    subject do
      post '/api/v1/teacher/teacher_notifications',
           params: params.to_json,
           headers: headers.merge('Cookie' => cookie)
    end

    let(:params) do
      {
        teacher_ids: teacher_ids
      }
    end

    context '正常系：存在する未送信教員を指定した場合' do
      let(:teacher_ids) { [pending_teacher1.id, pending_teacher2.id] }

      it '送信処理が開始されること' do
        expect do
          subject
        end.not_to raise_error

        expect(response).to have_http_status(:accepted)

        json = response.parsed_body
        expect(json['message']).to eq('送信処理を開始しました')
      end
    end

    context '一部存在しないIDを含む場合' do
      let(:teacher_ids) { [pending_teacher1.id, 999_999] }

      it '存在する教員のみ対象になること' do
        subject

        expect(response).to have_http_status(:accepted)

        json = response.parsed_body
        expect(json['message']).to eq('送信処理を開始しました')
      end
    end

    context '全て無効なIDの場合' do
      let(:teacher_ids) { [999_999, 888_888] }

      it 'エラーにならず空で処理されること' do
        subject

        expect(response).to have_http_status(:accepted)

        json = response.parsed_body
        expect(json['message']).to eq('送信処理を開始しました')
      end
    end

    context 'teacher_idsが空の場合' do
      let(:teacher_ids) { [] }

      it '処理は実行されること' do
        subject

        expect(response).to have_http_status(:accepted)
      end
    end

    context 'teacher_idsが未指定の場合' do
      let(:params) { {} }

      it 'エラーにならず処理されること' do
        subject

        expect(response).to have_http_status(:accepted)
      end
    end
  end
end
