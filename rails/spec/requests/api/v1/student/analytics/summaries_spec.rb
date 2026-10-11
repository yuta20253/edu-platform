# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Student::Analytics::Summaries', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  let!(:student) { create(:user, :student) }
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

  # 実行日と同じ日付にすると「今日」の扱いの誤りを見逃すため、実行日とずらした日付に固定する
  around do |example|
    travel_to(Time.zone.parse('2026-09-11 12:00:00')) { example.run }
  end

  describe 'GET /api/v1/student/analytics/summary' do
    subject(:request) do
      get '/api/v1/student/analytics/summary', params: params, headers: headers.merge('Cookie' => cookie)
    end

    let(:params) { { from: '2026-09-05', to: '2026-09-11' } }

    context '正常系' do
      let(:task) { create(:task, user: student) }

      before do
        create(:task, :completed, user: student, due_date: Date.new(2026, 9, 6))
        create(:task, user: student, due_date: Date.new(2026, 9, 7))
        create(:study_log, user: student, task: task, started_at: Time.zone.parse('2026-09-11 08:00:00'),
                           duration_minutes: 30)
        create(:study_log, user: student, task: task, started_at: Time.zone.parse('2026-09-03 08:00:00'),
                           duration_minutes: 15)
      end

      it '200が返る' do
        request

        expect(response).to have_http_status(:ok)
      end

      it '連続日数・タスク達成率・学習時間・教科ごとの正答率・metaを返す' do
        request

        body = response.parsed_body
        expect(body.keys).to contain_exactly('streak_days', 'task_completion', 'study_minutes', 'subject_progress',
                                             'meta')
        expect(body['streak_days']).to eq(1)
        expect(body['task_completion']['current']).to eq(
          'completed_count' => 1, 'total_count' => 2, 'completion_rate' => 50.0
        )
        expect(body['study_minutes']['total']).to eq('current' => 30, 'previous' => 15)
        expect(body['subject_progress']).to eq([])
      end

      it '日付は"YYYY-MM-DD"形式の文字列で返す' do
        request

        body = response.parsed_body
        expect(body['meta']).to eq(
          'from' => '2026-09-05',
          'to' => '2026-09-11',
          'previous_from' => '2026-08-29',
          'previous_to' => '2026-09-04'
        )
        expect(body['study_minutes']['series'].last).to eq('date' => '2026-09-11', 'minutes' => 30)
      end
    end

    context 'from / to を指定しない場合' do
      let(:params) { {} }

      it '直近7日(今日を含む)を期間にする' do
        request

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body['meta']).to include('from' => '2026-09-05', 'to' => '2026-09-11')
      end
    end

    context '日付の形式が不正な場合' do
      let(:params) { { from: '2026-09-99', to: '2026-09-11' } }

      it '422とエラーメッセージを返す' do
        request

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body['errors']).to include(a_string_including('は正しい日付を入力してください'))
      end
    end

    context 'toがfromより前の場合' do
      let(:params) { { from: '2026-09-11', to: '2026-09-05' } }

      it '422とエラーメッセージを返す' do
        request

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body['errors']).to include(a_string_including('はfrom以降の日付を指定してください'))
      end
    end

    context '期間が366日を超える場合' do
      let(:params) { { from: '2025-01-01', to: '2026-01-02' } }

      it '422とエラーメッセージを返す' do
        request

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body['errors']).to include('取得期間は366日以内で指定してください')
      end
    end

    context '未認証の場合' do
      it '401が返る' do
        get '/api/v1/student/analytics/summary', params: params, headers: headers

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'teacher権限の場合' do
      let!(:teacher) { create(:user, :teacher) }
      let(:cookie) { login_and_get_cookie(teacher) }

      it '403が返る' do
        request

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
