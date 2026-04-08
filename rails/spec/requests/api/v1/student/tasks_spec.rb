# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Student::Tasks', type: :request do
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

  describe 'GET /api/v1/student/tasks' do
    let!(:prefecture) { create(:prefecture, name: '東京都') }
    let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }
    let!(:user) { create(:user, high_school: high_school) }
    let!(:goal) { create(:goal, user: user) }

    context '正常系' do
      subject { get '/api/v1/student/tasks', headers: headers.merge('Cookie' => cookie) }

      let!(:cookie) { login_and_get_cookie(user) }
      let!(:tasks) { create_list(:task, 3, user: user, goal: goal) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it 'tasksキーが含まれる' do
        subject
        expect(response.parsed_body).to have_key('tasks')
      end

      it 'metaキーが含まれる' do
        subject
        expect(response.parsed_body).to have_key('meta')
      end

      it 'meta に必要なフィールドが含まれる' do
        subject
        meta = response.parsed_body['meta']
        expect(meta.keys).to include('current_page', 'total_pages', 'total_count', 'per_page')
      end

      it 'タスク一覧が取得される' do
        subject
        json = response.parsed_body

        expect(json['tasks'].size).to eq(3)
      end
    end

    context 'status指定あり' do
      subject do
        get '/api/v1/student/tasks',
            params: { status: 'completed' },
            headers: headers.merge('Cookie' => cookie)
      end

      let!(:cookie) { login_and_get_cookie(user) }
      let!(:completed_task) { create(:task, :completed, user: user, goal: goal) }
      let!(:in_progress_task) { create(:task, :in_progress, user: user, goal: goal) }

      it 'completedのみ返る' do
        subject
        json = response.parsed_body

        expect(json['tasks'].size).to eq(1)
        expect(json['tasks'].first['id']).to eq(completed_task.id)
      end
    end

    context 'status未指定' do
      let!(:not_started_task) { create(:task, user: user, goal: goal) }
      let!(:in_progress_task) { create(:task, :in_progress, user: user, goal: goal) }
      let!(:completed_task) { create(:task, :completed, user: user, goal: goal) }
      let!(:cookie) { login_and_get_cookie(user) }

      it '未完了タスクのみ返る' do
        get '/api/v1/student/tasks', headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body
        ids = json['tasks'].pluck('id')

        expect(ids).to include(not_started_task.id, in_progress_task.id)
        expect(ids).not_to include(completed_task.id)
      end
    end

    context '不正なstatus' do
      let!(:not_started_task) { create(:task, user: user, goal: goal) }
      let!(:completed_task) { create(:task, :completed, user: user, goal: goal) }
      let!(:cookie) { login_and_get_cookie(user) }

      it '未完了タスクのみ返る' do
        get '/api/v1/student/tasks',
            params: { status: 'hoge' },
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['tasks'].any? { |t| t['status'] == 'completed' }).to be false
      end
    end

    context '並び順' do
      let!(:cookie) { login_and_get_cookie(user) }

      it 'due_dateの降順で返る' do
        create(:task, user: user, goal: goal, due_date: Time.zone.today)
        task2 = create(:task, user: user, goal: goal, due_date: Date.tomorrow)

        get '/api/v1/student/tasks', headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body
        ids = json['tasks'].pluck('id')

        expect(ids.first).to eq(task2.id)
      end
    end

    context '異常系 - 未認証アクセス' do
      it '401が返される' do
        get '/api/v1/student/tasks', headers: headers.merge('Cookie' => nil)
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - ログイン生徒以外のアクセス' do
      let!(:other_user) { create(:user, :teacher) }
      let!(:cookie) { login_and_get_cookie(user) }

      it '403が返される' do
        cookie = login_and_get_cookie(other_user)
        get '/api/v1/student/tasks', headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'GET /api/v1/student/tasks/:id' do
    context '正常系' do
      subject { get "/api/v1/student/tasks/#{task.id}", headers: headers.merge('Cookie' => cookie) }

      let!(:prefecture) { create(:prefecture, name: '東京都') }
      let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }
      let!(:user) { create(:user, high_school: high_school) }
      let!(:goal) { create(:goal, user: user) }
      let!(:course) { create(:course) }
      let!(:units) { create_list(:unit, 3, course: course) }
      let!(:task) { create(:task, user: user, goal: goal, units: units) }
      let!(:other_task) { create(:task, user: user, goal: goal) }

      let!(:cookie) { login_and_get_cookie(user) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it '該当タスクが取得される' do
        subject
        json = response.parsed_body

        expect(json['id']).to eq(task.id)
        expect(json['id']).not_to eq(other_task.id)
      end

      it '紐づくUnitも返却される' do
        subject
        json = response.parsed_body

        expect(json['units'].size).to eq(3)
        expect(json['units'].pluck('id')).to match_array(units.map(&:id))
      end
    end

    context '異常系 - 未認証アクセス' do
      it '401が返される' do
        get '/api/v1/student/tasks/1', headers: headers.merge('Cookie' => nil)
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - ログイン生徒以外のアクセス' do
      let!(:other_user) { create(:user, :teacher) }

      it '403が返される' do
        cookie = login_and_get_cookie(other_user)
        get '/api/v1/student/tasks/1', headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
