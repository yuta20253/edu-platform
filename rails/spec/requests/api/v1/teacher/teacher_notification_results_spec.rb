# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Teacher::TeacherNotificationResults', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
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

  let!(:teacher_role) { create(:user_role, name: :teacher) }
  let!(:high_school) { create(:high_school) }

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

  let!(:login_teacher) do
    create(
      :user,
      user_role: teacher_role,
      high_school: high_school
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

  describe 'GET /api/v1/teacher/teacher_notification_results' do
    subject do
      get '/api/v1/teacher/teacher_notification_results',
          headers: headers.merge('Cookie' => cookie)
    end

    context '正常系' do
      it '同一高校の通知履歴が新しい順で取得できること' do
        subject

        expect(response).to have_http_status(:ok)

        json = response.parsed_body

        expect(json.length).to eq(2)

        # 並び順確認（desc）
        expect(json.first['id']).to eq(notification2.id)
        expect(json.last['id']).to eq(notification1.id)
      end
    end

    context '他校の通知が存在する場合' do
      let!(:other_high_school) { create(:high_school) }

      let!(:other_teacher) do
        create(
          :user,
          user_role: teacher_role,
          high_school: other_high_school
        )
      end

      let!(:other_receiver) do
        create(
          :user,
          user_role: teacher_role,
          high_school: other_high_school
        )
      end

      let!(:other_notification) do
        create(
          :teacher_notification,
          sender_user: other_teacher,
          receiver_user: other_receiver,
          email: other_receiver.email,
          sent_at: Time.current,
          status: 'sent'
        )
      end

      it '他校の通知は含まれないこと' do
        subject

        expect(response).to have_http_status(:ok)

        json = response.parsed_body

        ids = json.pluck('id')

        expect(ids).to include(notification1.id, notification2.id)
        expect(ids).not_to include(other_notification.id)
      end
    end
  end

  describe 'GET /api/v1/teacher/teacher_notification_results?sent_at=YYYY-MM-DD' do
    let(:sent_at) { notification2.sent_at.to_date.to_s }

    subject do
      get "/api/v1/teacher/teacher_notification_results?sent_at=#{sent_at}",
          headers: headers.merge('Cookie' => cookie)
    end

    it 'sent_atで絞り込みできること' do
      subject

      expect(response).to have_http_status(:ok)

      json = response.parsed_body

      ids = json.pluck('id')

      expect(ids).to include(notification2.id)
      expect(ids).not_to include(notification1.id)
    end
  end
end
