# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Student::Units', type: :request do
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

  describe 'GET /api/v1/student/tasks/:task_id/units/:id' do
    let!(:prefecture) { create(:prefecture, name: '東京都') }
    let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }
    let!(:user) { create(:user, high_school: high_school) }
    let!(:goal) { create(:goal, user: user) }
    let!(:task) { create(:task, user: user, goal: goal) }
    let!(:course) { create(:course) }
    let!(:unit) { create(:unit, course: course) }

    before do
      task.units << unit
    end

    context '正常系' do
      subject do
        get "/api/v1/student/tasks/#{task.id}/units/#{unit.id}",
            headers: headers.merge('Cookie' => cookie)
      end

      let!(:cookie) { login_and_get_cookie(user) }

      it '200が返る' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it 'unitが取得できる' do
        subject
        expect(response.parsed_body['id']).to eq(unit.id)
      end
    end

    context '異常系 - タスクに紐づかないunit' do
      let!(:cookie) { login_and_get_cookie(user) }
      let!(:other_unit) { create(:unit, course: course) }

      it '404が返る' do
        get "/api/v1/student/tasks/#{task.id}/units/#{other_unit.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end
    end

    context '異常系 - 未認証' do
      it '401が返る' do
        get "/api/v1/student/tasks/#{task.id}/units/#{unit.id}",
            headers: headers.merge('Cookie' => nil)

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 生徒以外' do
      let!(:other_user) { create(:user, :teacher) }

      it '403が返る' do
        cookie = login_and_get_cookie(other_user)

        get "/api/v1/student/tasks/#{task.id}/units/#{unit.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context '異常系 - 他の生徒のタスクにアクセス' do
      let!(:user) { create(:user) }
      let!(:other_user) { create(:user) }
      let!(:goal) { create(:goal, user: other_user) }
      let!(:course) { create(:course) }
      let!(:units) { create_list(:unit, 3, course: course) }
      let!(:task) { create(:task, user: other_user, goal: goal, units: units) }
      let!(:cookie) { login_and_get_cookie(user) }

      it '404が返される' do
        get "/api/v1/student/tasks/#{task.id}", headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
