# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Student::Calendars', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  let!(:student) { create(:user, :student) }
  let!(:other_student) { create(:user, :student) }
  let(:cookie) { login_and_get_cookie(student) }

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: {
           email: user.email,
           password: 'password'
         }.to_json,
         headers: headers

    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/student/calendar' do
    subject(:request) do
      get '/api/v1/student/calendar', params: params, headers: headers.merge('Cookie' => cookie)
    end

    let(:params) { { from: '2026-03-01', to: '2026-03-31' } }

    context '正常系' do
      let!(:goal) { create(:goal, user: student, title: 'ゴールA', due_date: Date.new(2026, 3, 10)) }
      let!(:task) do
        create(:task, user: student, goal: create(:goal, user: student), title: 'タスクA',
                      due_date: Date.new(2026, 3, 5))
      end
      let!(:other_goal) { create(:goal, user: other_student, due_date: Date.new(2026, 3, 12)) }

      it '200が返る' do
        request

        expect(response).to have_http_status(:ok)
      end

      it '期間内のgoal・taskが日付昇順で返る' do
        request

        body = response.parsed_body
        expect(body.pluck('type')).to eq(%w[task goal])
        expect(body.pluck('id')).to eq([task.id, goal.id])
      end

      it '他の生徒のデータは含まれない' do
        request

        ids = response.parsed_body.pluck('id')
        expect(ids).not_to include(other_goal.id)
      end
    end

    context 'fromが未指定の場合' do
      let(:params) { { to: '2026-03-31' } }

      it '422が返る' do
        request

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context 'toが未指定の場合' do
      let(:params) { { from: '2026-03-01' } }

      it '422が返る' do
        request

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '日付の形式が不正な場合' do
      let(:params) { { from: '2026-03-99', to: '2026-03-31' } }

      it '422が返る' do
        request

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context 'toがfromより前の場合' do
      let(:params) { { from: '2026-03-31', to: '2026-03-01' } }

      it '422が返る' do
        request

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '期間が92日を超える場合' do
      let(:params) { { from: '2026-01-01', to: '2026-04-03' } }

      it '422が返る' do
        request

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '未認証の場合' do
      it 'アクセスできない' do
        get '/api/v1/student/calendar', params: params, headers: headers

        expect(response).not_to have_http_status(:ok)
      end
    end
  end
end
