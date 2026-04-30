# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Teacher::TeacherNotificationResults', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  let!(:sender) do
    create(
      :user,
      user_role: teacher_role,
      high_school: high_school,
      name: '送信者'
    )
  end
  let!(:receiver) do
    create(
      :user,
      user_role: teacher_role,
      high_school: high_school,
      name: '受信者'
    )
  end
  let!(:notification1) do
    create(
      :teacher_notification,
      sender_user: sender,
      receiver_user: receiver,
      email: receiver.email,
      sent_at: 2.days.ago,
      status: 'sent'
    )
  end
  let!(:notification2) do
    create(
      :teacher_notification,
      sender_user: sender,
      receiver_user: receiver,
      email: receiver.email,
      sent_at: 1.day.ago,
      status: 'sent'
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

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: {
           email: user.email,
           password: 'password'
         }.to_json,
         headers: headers

    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/teacher/teacher_notification_results' do
    subject do
      get '/api/v1/teacher/teacher_notification_results',
          headers: headers.merge('Cookie' => cookie)
    end

    it '通知履歴が取得できること（新しい順）' do
      subject

      expect(response).to have_http_status(:ok)

      json = response.parsed_body

      expect(json.length).to eq(2)

      # order確認（desc）
      expect(json.first['id']).to eq(notification2.id)
      expect(json.last['id']).to eq(notification1.id)
    end
  end

  describe 'GET with sent_at filter' do
    subject do
      get "/api/v1/teacher/teacher_notification_results?sent_at=#{sent_at}",
          headers: headers.merge('Cookie' => cookie)
    end

    let(:sent_at) { notification2.sent_at.to_date.to_s }

    it 'sent_atで絞り込めること' do
      subject

      expect(response).to have_http_status(:ok)

      json = response.parsed_body

      expect(json.pluck('id')).to include(notification2.id)
      expect(json.pluck('id')).not_to include(notification1.id)
    end
  end
end
