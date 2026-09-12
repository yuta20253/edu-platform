# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Teacher::InterviewRequestMessages', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  let!(:high_school) { create(:high_school) }
  let!(:teacher) { create(:user, :teacher, high_school: high_school) }
  let!(:student) { create(:user, :student, high_school: high_school) }
  let!(:interview_request) do
    create(:interview_request, :initiated_by_teacher, teacher: teacher, student: student, status: :requested)
  end
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

  describe 'GET /api/v1/teacher/interview_requests/:interview_request_id/messages' do
    let!(:message) { create(:interview_request_message, interview_request: interview_request, sender: teacher) }

    it '200が返る' do
      get "/api/v1/teacher/interview_requests/#{interview_request.id}/messages",
          headers: headers.merge('Cookie' => cookie)

      expect(response).to have_http_status(:ok)
    end

    it '件数によらずusersへのクエリ件数が増えない(N+1にならない)' do
      create_list(:interview_request_message, 4, interview_request: interview_request, sender: teacher)
      request_headers = headers.merge('Cookie' => cookie)

      queries = []
      callback = lambda { |_n, _s, _f, _id, payload|
        queries << payload[:sql] if payload[:name] != 'SCHEMA'
      }
      ActiveSupport::Notifications.subscribed(callback, 'sql.active_record') do
        get "/api/v1/teacher/interview_requests/#{interview_request.id}/messages", headers: request_headers
      end

      user_queries = queries.grep(/FROM `users`/i)
      # 内訳: current_userの認証クエリ1件 + senderのバッチpreloadクエリ1件(N+1ならメッセージ数に比例して増える)
      expect(user_queries.size).to be <= 2
    end

    it 'メッセージ一覧が返る' do
      get "/api/v1/teacher/interview_requests/#{interview_request.id}/messages",
          headers: headers.merge('Cookie' => cookie)

      json = response.parsed_body
      ids = json['interview_request_messages'].pluck('id')
      expect(ids).to contain_exactly(message.id)
    end

    it 'meta情報が返る' do
      get "/api/v1/teacher/interview_requests/#{interview_request.id}/messages",
          headers: headers.merge('Cookie' => cookie)

      json = response.parsed_body

      expect(json['meta']['current_page']).to eq(1)
      expect(json['meta']['total_count']).to eq(1)
      expect(json['meta']['per_page']).to eq(20)
    end

    context 'メッセージが21件以上ある場合' do
      before { create_list(:interview_request_message, 25, interview_request: interview_request, sender: teacher) }

      it '1ページ20件返る' do
        get "/api/v1/teacher/interview_requests/#{interview_request.id}/messages",
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body
        expect(json['interview_request_messages'].size).to eq(20)
      end

      it 'page=2で2ページ目が返る' do
        get "/api/v1/teacher/interview_requests/#{interview_request.id}/messages",
            params: { page: 2 },
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body
        expect(json['meta']['current_page']).to eq(2)
        expect(json['interview_request_messages'].size).to eq(6)
      end
    end
  end

  describe 'POST /api/v1/teacher/interview_requests/:interview_request_id/messages' do
    let(:params) { { interview_request_message: { body: '来週の火曜16時はいかがですか?' } } }

    it '201が返る' do
      post "/api/v1/teacher/interview_requests/#{interview_request.id}/messages",
           params: params.to_json, headers: headers.merge('Cookie' => cookie)

      expect(response).to have_http_status(:created)
    end

    it 'メッセージが作成される' do
      expect do
        post "/api/v1/teacher/interview_requests/#{interview_request.id}/messages",
             params: params.to_json, headers: headers.merge('Cookie' => cookie)
      end.to change(InterviewRequestMessage, :count).by(1)
    end

    it 'requestedからschedulingになる' do
      post "/api/v1/teacher/interview_requests/#{interview_request.id}/messages",
           params: params.to_json, headers: headers.merge('Cookie' => cookie)

      expect(interview_request.reload.status).to eq('scheduling')
    end

    context '本文が空の場合' do
      let(:params) { { interview_request_message: { body: '' } } }

      it '422が返る' do
        post "/api/v1/teacher/interview_requests/#{interview_request.id}/messages",
             params: params.to_json, headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '担当外の面談の場合' do
      let!(:other_teacher) { create(:user, :teacher, high_school: high_school) }
      let(:other_cookie) { login_and_get_cookie(other_teacher) }

      it '404が返る' do
        post "/api/v1/teacher/interview_requests/#{interview_request.id}/messages",
             params: params.to_json, headers: headers.merge('Cookie' => other_cookie)

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
