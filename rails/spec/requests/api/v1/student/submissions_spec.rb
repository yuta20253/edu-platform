# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Student::Submissions', type: :request do
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

  describe 'PATCH /api/v1/student/tasks/:task_id/units/:unit_id/submission' do
    let!(:prefecture) { create(:prefecture, name: '東京都') }
    let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }

    let!(:user) { create(:user, high_school: high_school) }
    let!(:goal) { create(:goal, user: user) }
    let!(:task) { create(:task, user: user, goal: goal) }

    let!(:course) { create(:course) }
    let!(:unit) { create(:unit, course: course) }
    let!(:task_unit) { create(:task_unit, task: task, unit: unit) }

    context '正常系' do
      let(:cookie) { login_and_get_cookie(user) }

      let(:completion_service) do
        instance_double(Student::TaskCompletionService, call: :completed)
      end

      let(:updater_service) do
        instance_double(Student::TaskStatusUpdaterService, call: true)
      end

      before do
        allow(Student::TaskCompletionService)
          .to receive(:new)
          .and_return(completion_service)

        allow(Student::TaskStatusUpdaterService)
          .to receive(:new)
          .and_return(updater_service)
      end

      it 'ステータス200が返る' do
        patch "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/submission",
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it 'statusが返る' do
        patch "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/submission",
              headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['status']).to eq('completed')
      end

      it 'TaskCompletionServiceが呼ばれる' do
        patch "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/submission",
              headers: headers.merge('Cookie' => cookie)

        expect(Student::TaskCompletionService)
          .to have_received(:new)
          .with(
            user: user,
            task_id: task.id.to_s
          )

        expect(completion_service).to have_received(:call)
      end

      it 'TaskStatusUpdaterServiceが呼ばれる' do
        patch "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/submission",
              headers: headers.merge('Cookie' => cookie)

        expect(Student::TaskStatusUpdaterService)
          .to have_received(:new)
          .with(
            user: user,
            task_id: task.id.to_s,
            status: :completed
          )

        expect(updater_service).to have_received(:call)
      end
    end

    context '異常系 - 未認証アクセス' do
      it '401が返る' do
        patch "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/submission",
              headers: headers

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 生徒以外でログイン' do
      let!(:teacher) { create(:user, :teacher) }
      let(:cookie) { login_and_get_cookie(teacher) }

      it '403が返る' do
        patch "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/submission",
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context '異常系 - 他人のtask_idを指定' do
      let!(:other_user) { create(:user, high_school: high_school) }
      let!(:other_goal) { create(:goal, user: other_user) }
      let!(:other_task) { create(:task, user: other_user, goal: other_goal) }

      let!(:other_task_unit) do
        create(:task_unit, task: other_task, unit: unit)
      end

      let(:cookie) { login_and_get_cookie(user) }

      it '404が返る' do
        patch "/api/v1/student/tasks/#{other_task.id}/units/#{unit.id}/submission",
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
