# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Student::Questions', type: :request do
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

  describe 'GET /api/v1/student/tasks/:task_id/units/:unit_id/questions' do
    context '正常系' do
      let!(:prefecture) { create(:prefecture, name: '東京都') }
      let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }
      let!(:user) { create(:user, high_school: high_school) }
      let!(:goal) { create(:goal, user: user) }
      let!(:course) { create(:course) }
      let!(:task) { create(:task, user: user, goal: goal) }
      let!(:unit) { create(:unit, course: course) }
      let!(:task_unit) { create(:task_unit, task: task, unit: unit) }

      let!(:question_one) { create(:question, unit: unit) }
      let!(:question_two) { create(:question, unit: unit) }

      let!(:cookie) { login_and_get_cookie(user) }

      it 'ステータス200が返される' do
        get "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/questions",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it '指定unitの問題一覧が取得される' do
        get "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/questions",
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json.size).to eq(2)
        expect(json.pluck('id')).to contain_exactly(question_one.id, question_two.id)
      end
    end

    context '異常系 - 未認証アクセス' do
      it '401が返される' do
        get '/api/v1/student/tasks/1/units/1/questions',
            headers: headers

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - ログイン生徒以外のアクセス(ロール)' do
      let!(:teacher) { create(:user, :teacher) }
      let!(:cookie) { login_and_get_cookie(teacher) }

      it '403が返される' do
        get '/api/v1/student/tasks/1/units/1/questions',
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context '異常系 - 他の生徒のtaskにアクセス' do
      let!(:prefecture) { create(:prefecture, name: '東京都') }
      let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }

      let!(:user) { create(:user, high_school: high_school) }
      let!(:other_user) { create(:user, high_school: high_school) }

      let!(:goal) { create(:goal, user: other_user) }
      let!(:course) { create(:course) }

      let!(:task) { create(:task, user: other_user, goal: goal) }
      let!(:unit) { create(:unit, course: course) }
      let!(:task_unit) { create(:task_unit, task: task, unit: unit) }

      let!(:question) { create(:question, unit: unit) }

      let!(:cookie) { login_and_get_cookie(user) }

      it '404が返される' do
        get "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/questions",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end
    end

    context '異常系 - taskに紐づかないunitにアクセス' do
      let!(:prefecture) { create(:prefecture, name: '東京都') }
      let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }

      let!(:user) { create(:user, high_school: high_school) }
      let!(:goal) { create(:goal, user: user) }
      let!(:course) { create(:course) }

      let!(:task) { create(:task, user: user, goal: goal) }
      let!(:unit) { create(:unit, course: course) }
      let!(:other_unit) { create(:unit, course: course) }

      let!(:task_unit) { create(:task_unit, task: task, unit: unit) }

      let!(:cookie) { login_and_get_cookie(user) }

      it '404が返される' do
        get "/api/v1/student/tasks/#{task.id}/units/#{other_unit.id}/questions",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
