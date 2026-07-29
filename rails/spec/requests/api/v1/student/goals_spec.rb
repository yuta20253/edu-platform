# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Student::Goals', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  let!(:prefecture) { create(:prefecture, name: '東京都') }
  let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }
  let!(:user) { create(:user, high_school: high_school) }
  let!(:cookie) { login_and_get_cookie(user) }

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: { email: user.email, password: 'password' }.to_json,
         headers: headers
    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/student/goals' do
    context '正常系' do
      subject { get '/api/v1/student/goals', headers: headers.merge('Cookie' => cookie) }

      let!(:goals) { create_list(:goal, 3, user: user) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it 'goalsキーが含まれる' do
        subject
        expect(response.parsed_body).to have_key('goals')
      end

      it 'metaキーが含まれる' do
        subject
        expect(response.parsed_body).to have_key('meta')
      end

      it 'metaに必要なフィールドが含まれる' do
        subject

        meta = response.parsed_body['meta']

        expect(meta.keys).to include(
          'current_page',
          'total_pages',
          'total_count',
          'per_page'
        )
      end

      it '目標一覧が取得される' do
        subject

        expect(response.parsed_body['goals'].size).to eq(3)
      end
    end
  end

  describe 'GET /api/v1/student/goals/:id' do
    let!(:goal) { create(:goal, user: user) }

    context '正常系' do
      subject do
        get "/api/v1/student/goals/#{goal.id}",
            headers: headers.merge('Cookie' => cookie)
      end

      it 'ステータス200が返される' do
        subject

        expect(response).to have_http_status(:ok)
      end

      it '目標詳細が取得できる' do
        subject

        expect(response.parsed_body['id']).to eq(goal.id)
      end
    end

    context '異常系' do
      let!(:other_goal) { create(:goal) }

      it '他人のGoalは404を返す' do
        get "/api/v1/student/goals/#{other_goal.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'POST /api/v1/student/goals' do
    subject do
      post '/api/v1/student/goals',
           params: params.to_json,
           headers: headers.merge('Cookie' => cookie)
    end

    context '正常系' do
      let(:params) do
        {
          goal: {
            title: '英語を頑張る',
            description: '毎日勉強する',
            due_date: (Date.current + 30.days).to_s
          }
        }
      end

      it 'Goalが作成される' do
        expect { subject }.to change(Goal, :count).by(1)

        expect(response).to have_http_status(:created)
      end
    end

    context '異常系' do
      context 'タイトルが未入力の場合' do
        let(:params) do
          {
            goal: {
              title: '',
              description: 'test',
              due_date: (Date.current + 7.days).to_s
            }
          }
        end

        it '422を返す' do
          subject

          expect(response).to have_http_status(:unprocessable_content)
        end
      end

      context '期限が未入力の場合' do
        let(:params) do
          {
            goal: {
              title: '英語',
              description: 'test',
              due_date: nil
            }
          }
        end

        it '422を返す' do
          subject

          expect(response).to have_http_status(:unprocessable_content)
        end
      end
    end
  end

  describe 'PATCH /api/v1/student/goals/:id' do
    subject do
      patch "/api/v1/student/goals/#{goal.id}",
            params: params.to_json,
            headers: headers.merge('Cookie' => cookie)
    end

    let!(:goal) { create(:goal, user: user) }

    context '正常系' do
      let(:params) do
        {
          goal: {
            title: '更新後タイトル',
            description: '更新後説明',
            due_date: (Date.current + 30.days).to_s
          }
        }
      end

      it 'Goalが更新される' do
        subject

        expect(response).to have_http_status(:ok)

        goal.reload

        expect(goal.title).to eq('更新後タイトル')
        expect(goal.description).to eq('更新後説明')
      end
    end

    context '異常系' do
      context '他人のGoalを更新する場合' do
        let!(:other_goal) { create(:goal) }

        let(:params) do
          {
            goal: {
              title: '更新'
            }
          }
        end

        it '404を返す' do
          patch "/api/v1/student/goals/#{other_goal.id}",
                params: params.to_json,
                headers: headers.merge('Cookie' => cookie)

          expect(response).to have_http_status(:not_found)
        end
      end

      context 'タイトルが未入力の場合' do
        let(:params) do
          {
            goal: {
              title: '',
              description: '更新',
              due_date: (Date.current + 30.days).to_s
            }
          }
        end

        it '422を返す' do
          subject

          expect(response).to have_http_status(:unprocessable_content)
        end
      end

      context '期限が未入力の場合' do
        let(:params) do
          {
            goal: {
              title: '更新',
              description: '更新',
              due_date: nil
            }
          }
        end

        it '422を返す' do
          subject

          expect(response).to have_http_status(:unprocessable_content)
        end
      end
    end
  end
end
