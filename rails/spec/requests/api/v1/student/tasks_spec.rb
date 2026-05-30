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

      it 'due_dateの昇順で返る' do
        task1 = create(:task, user: user, goal: goal, due_date: Date.current)
        task2 = create(:task, user: user, goal: goal, due_date: Date.tomorrow)

        get '/api/v1/student/tasks', headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body
        ids = json['tasks'].pluck('id')

        expect(ids.first).to eq(task1.id)
        expect(ids.first).not_to eq(task2.id)
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

    context '異常系 - ログイン生徒以外のアクセス(ロール)' do
      let!(:other_user) { create(:user, :teacher) }

      it '403が返される' do
        cookie = login_and_get_cookie(other_user)
        get '/api/v1/student/tasks/1', headers: headers.merge('Cookie' => cookie)
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

  describe 'POST /api/v1/student/tasks' do
    let!(:prefecture) { create(:prefecture, name: '東京都') }
    let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }
    let!(:user) { create(:user, high_school: high_school) }
    let!(:goal) { create(:goal, user: user) }
    let!(:course) { create(:course) }
    let!(:units) { create_list(:unit, 2, course: course) }

    let!(:cookie) { login_and_get_cookie(user) }

    let(:params) do
      {
        task: {
          goal_id: goal.id,
          title: '英単語学習',
          content: '毎日30分勉強する',
          priority: 'high',
          due_date: Date.current + 7.days,
          memo: '重要',
          unit_ids: units.pluck(:id)
        }
      }
    end

    context '正常系' do
      subject do
        post '/api/v1/student/tasks',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)
      end

      it 'ステータス201が返される' do
        subject
        expect(response).to have_http_status(:created)
      end

      it 'タスクが作成される' do
        expect do
          subject
        end.to change(Task, :count).by(1)
      end

      it 'レスポンスメッセージが返る' do
        subject
        json = response.parsed_body

        expect(json['message']).to eq('タスクが作成されました。')
      end

      it 'unitが紐づいて作成される' do
        subject

        task = Task.last

        expect(task.units.pluck(:id)).to match_array(units.pluck(:id))
      end
    end

    context '異常系 - バリデーションエラー' do
      let(:params) do
        {
          task: {
            goal_id: goal.id,
            title: '',
            content: '',
            priority: '',
            due_date: nil,
            memo: '',
            unit_ids: []
          }
        }
      end

      it '422が返される' do
        post '/api/v1/student/tasks',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end

      it 'errorsが返される' do
        post '/api/v1/student/tasks',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json).to have_key('errors')
      end

      it 'タスクは作成されない' do
        expect do
          post '/api/v1/student/tasks',
               params: params.to_json,
               headers: headers.merge('Cookie' => cookie)
        end.not_to change(Task, :count)
      end
    end

    context '異常系 - 未認証アクセス' do
      before do
        delete '/api/v1/user/logout', headers: headers.merge('Cookie' => cookie)
      end

      it '401が返される' do
        post '/api/v1/student/tasks',
             params: params.to_json,
             headers: headers

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - ログイン生徒以外のアクセス' do
      let!(:teacher) { create(:user, :teacher) }

      it '403が返される' do
        teacher_cookie = login_and_get_cookie(teacher)

        post '/api/v1/student/tasks',
             params: params.to_json,
             headers: headers.merge('Cookie' => teacher_cookie)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'PATCH /api/v1/student/tasks/:id' do
    let!(:prefecture) { create(:prefecture, name: '東京都') }
    let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }
    let!(:user) { create(:user, high_school: high_school) }
    let!(:goal) { create(:goal, user: user) }

    let!(:course) { create(:course) }
    let!(:units) { create_list(:unit, 2, course: course) }

    let!(:cookie) { login_and_get_cookie(user) }

    let!(:task) do
      create(
        :task,
        user: user,
        goal: goal,
        title: '更新前タイトル'
      )
    end

    let(:params) do
      {
        task: {
          title: '更新後タイトル',
          content: '更新後コンテンツ',
          priority: 'normal',
          due_date: Date.current + 10.days,
          memo: '更新後メモ',
          unit_ids: units.pluck(:id)
        }
      }
    end

    context '正常系' do
      subject do
        patch "/api/v1/student/tasks/#{task.id}",
              params: params.to_json,
              headers: headers.merge('Cookie' => cookie)
      end

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it 'タスクが更新される' do
        subject

        task.reload

        expect(task.title).to eq('更新後タイトル')
        expect(task.content).to eq('更新後コンテンツ')
        expect(task.priority).to eq('normal')
        expect(task.memo).to eq('更新後メモ')
      end

      it 'unitが更新される' do
        subject

        task.reload

        expect(task.units.pluck(:id)).to match_array(units.pluck(:id))
      end

      it 'レスポンスメッセージが返る' do
        subject

        json = response.parsed_body

        expect(json['message']).to eq('タスクが更新されました。')
      end
    end

    context '異常系 - バリデーションエラー' do
      let(:params) do
        {
          task: {
            title: '',
            content: '',
            priority: '',
            due_date: nil,
            memo: '',
            unit_ids: []
          }
        }
      end

      it '422が返される' do
        patch "/api/v1/student/tasks/#{task.id}",
              params: params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end

      it 'errorsが返される' do
        patch "/api/v1/student/tasks/#{task.id}",
              params: params.to_json,
              headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json).to have_key('errors')
      end
    end

    context '異常系 - 未認証アクセス' do
      before do
        delete '/api/v1/user/logout', headers: headers.merge('Cookie' => cookie)
      end

      it '401が返される' do
        patch "/api/v1/student/tasks/#{task.id}",
              params: params.to_json,
              headers: headers

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - ログイン生徒以外のアクセス(ロール)' do
      let!(:teacher) { create(:user, :teacher) }

      it '403が返される' do
        teacher_cookie = login_and_get_cookie(teacher)

        patch "/api/v1/student/tasks/#{task.id}",
              params: params.to_json,
              headers: headers.merge('Cookie' => teacher_cookie)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context '異常系 - 他の生徒のタスク更新' do
      let!(:other_user) { create(:user) }
      let!(:other_goal) { create(:goal, user: other_user) }

      let!(:other_task) do
        create(
          :task,
          user: other_user,
          goal: other_goal
        )
      end

      it '404が返される' do
        patch "/api/v1/student/tasks/#{other_task.id}",
              params: params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
