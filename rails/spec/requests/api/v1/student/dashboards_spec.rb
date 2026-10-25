# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Student::Dashboards', type: :request do
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

  describe 'GET /api/v1/student/dashboard' do
    subject { get '/api/v1/student/dashboard', headers: headers.merge('Cookie' => cookie) }

    let(:redis) { RedisConnection.client }
    let(:key) { "student:today_answer_count:#{user.id}:#{Time.current.to_date.iso8601}" }

    after { redis.del(key) }

    context '正常系' do
      let!(:goals) { create_list(:goal, 2, user: user) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it 'goalsキーが含まれる' do
        subject
        expect(response.parsed_body['goals'].size).to eq(2)
      end

      it '各goalに紐づくtasksが含まれる' do
        create_list(:task, 2, user: user, goal: goals.first)

        subject

        goal_json = response.parsed_body['goals'].find { |g| g['id'] == goals.first.id }
        expect(goal_json['tasks'].size).to eq(2)
      end

      it '複数件でも全件を返す(N+1 は Bullet が検知する)' do
        # Bullet は 2 件以上を読み込んだときだけ N+1 を検知する。件数を 1 にしないこと
        tasks = goals.flat_map { |goal| create_list(:task, 2, user: user, goal: goal) }

        subject

        task_ids = response.parsed_body['goals'].flat_map { |goal| goal['tasks'].pluck('id') }
        expect(task_ids).to contain_exactly(*tasks.map(&:id))
      end

      it '本日の回答がない場合today_answer_countは0' do
        subject
        expect(response.parsed_body['today_answer_count']).to eq(0)
      end

      it '本日回答済みの場合はその件数が返る' do
        Student::IncrementTodayAnswerCountService.new(user: user).call
        Student::IncrementTodayAnswerCountService.new(user: user).call

        subject

        expect(response.parsed_body['today_answer_count']).to eq(2)
      end
    end

    context 'Redis接続エラーが発生する場合' do
      before { allow(redis).to receive(:get).and_raise(Redis::BaseConnectionError) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it 'today_answer_countは0になる' do
        subject
        expect(response.parsed_body['today_answer_count']).to eq(0)
      end
    end
  end
end
