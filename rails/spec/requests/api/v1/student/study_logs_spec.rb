# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Student::StudyLogs', type: :request do
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

  describe 'POST /api/v1/student/tasks/:task_id/units/:unit_id/study_logs' do
    subject(:request) do
      post "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/study_logs",
           headers: headers.merge('Cookie' => cookie)
    end

    let!(:task) { create(:task, user: user) }
    let!(:unit) { create(:unit) }

    it 'StudyLogを作成できること' do
      task.units << unit

      expect { request }.to change(StudyLog, :count).by(1)

      expect(response).to have_http_status(:ok)

      study_log = StudyLog.last

      expect(study_log.user).to eq(user)
      expect(study_log.task).to eq(task)
      expect(study_log.unit).to eq(unit)
      expect(study_log.status).to eq('studying')
      expect(study_log.started_at).to be_present
      expect(study_log.ended_at).to be_nil
      expect(study_log.duration_minutes).to be_nil
    end

    it 'StudyLogのIDを返すこと' do
      task.units << unit

      request

      expect(response.parsed_body['study_log_id']).to eq(StudyLog.last.id)
    end

    it '同じTask/Unitで複数のStudyLogを作成できること' do
      task.units << unit

      create(
        :study_log,
        user: user,
        task: task,
        unit: unit,
        status: :completed,
        started_at: 1.hour.ago,
        ended_at: 30.minutes.ago,
        duration_minutes: 30
      )

      expect { request }.to change(StudyLog, :count).by(1)

      expect(response).to have_http_status(:ok)

      study_logs = StudyLog.where(
        user: user,
        task: task,
        unit: unit
      )

      expect(study_logs.count).to eq(2)
    end

    context '他ユーザーのTaskの場合' do
      let!(:other_user) { create(:user, high_school: high_school) }
      let!(:task) { create(:task, user: other_user) }

      it 'StudyLogを作成できないこと' do
        expect { request }.not_to change(StudyLog, :count)

        expect(response).to have_http_status(:not_found)
      end
    end

    context 'Taskに紐づいていないUnitの場合' do
      let!(:unit) { create(:unit) }

      it 'StudyLogを作成できないこと' do
        expect { request }.not_to change(StudyLog, :count)

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'PATCH /api/v1/student/tasks/:task_id/units/:unit_id/study_logs/:id' do
    subject(:request) do
      patch "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/study_logs/#{study_log.id}",
            headers: headers.merge('Cookie' => cookie)
    end

    let!(:task) { create(:task, user: user) }
    let!(:unit) { create(:unit) }
    let!(:study_log) do
      create(
        :study_log,
        user: user,
        task: task,
        unit: unit,
        status: :studying,
        started_at: started_at
      )
    end
    let(:started_at) { Time.zone.parse('2026-08-09 10:00:00') }

    before do
      task.units << unit
    end

    it 'StudyLogを完了できること' do
      travel_to Time.zone.parse('2026-08-09 10:30:00') do
        request

        expect(response).to have_http_status(:ok)

        study_log.reload

        expect(study_log.status).to eq('completed')
        expect(study_log.ended_at).to eq(Time.zone.parse('2026-08-09 10:30:00'))
        expect(study_log.duration_minutes).to eq(30)
      end
    end

    it '完了したStudyLogをレスポンスすること' do
      travel_to Time.zone.parse('2026-08-09 10:30:00') do
        request

        expect(response.parsed_body['id']).to eq(study_log.id)
      end
    end

    context '他ユーザーのStudyLogの場合' do
      let!(:other_user) { create(:user, high_school: high_school) }
      let!(:task) { create(:task, user: other_user) }
      let!(:study_log) do
        create(
          :study_log,
          user: other_user,
          task: task,
          unit: unit,
          status: :studying,
          started_at: 30.minutes.ago
        )
      end

      it 'StudyLogを完了できないこと' do
        expect { request }.not_to(change { study_log.reload.status })

        expect(response).to have_http_status(:not_found)
      end
    end

    context 'StudyLogがすでに完了している場合' do
      let!(:study_log) do
        create(
          :study_log,
          user: user,
          task: task,
          unit: unit,
          status: :completed,
          started_at: Time.zone.parse('2026-08-09 10:00:00'),
          ended_at: Time.zone.parse('2026-08-09 10:30:00'),
          duration_minutes: 30
        )
      end

      it 'StudyLogを再度完了できないこと' do
        expect { request }.not_to(change { study_log.reload.updated_at })

        study_log.reload

        expect(study_log.status).to eq('completed')
        expect(study_log.duration_minutes).to eq(30)
        expect(study_log.ended_at).to eq(
          Time.zone.parse('2026-08-09 10:30:00')
        )
      end

      it '400とエラーメッセージが返されること' do
        request

        expect(response).to have_http_status(:bad_request)
        expect(response.parsed_body['errors']).to eq(['この学習ログはすでに完了しています'])
      end
    end
  end
end
