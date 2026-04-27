# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Student::Confirmations', type: :request do
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

  describe 'GET /api/v1/student/tasks/:task_id/units/:unit_id/confirmation' do
    context '正常系' do
      let!(:prefecture) { create(:prefecture, name: '東京都') }
      let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }

      let!(:user) { create(:user, high_school: high_school) }
      let!(:goal) { create(:goal, user: user) }

      let!(:task) { create(:task, user: user, goal: goal) }
      let!(:course) { create(:course) }
      let!(:unit) { create(:unit, course: course) }
      let!(:task_unit) { create(:task_unit, task: task, unit: unit) }

      let!(:first_question) { create(:question, unit: unit) }
      let!(:second_question) { create(:question, unit: unit) }

      let!(:first_choice) do
        create(
          :question_choice,
          question: first_question,
          choice_number: 2
        )
      end

      let!(:second_choice) do
        create(
          :question_choice,
          question: second_question,
          choice_number: 4
        )
      end

      let!(:first_history) do
        create(
          :question_history,
          user: user,
          task: task,
          course: course,
          unit: unit,
          question: first_question,
          question_choice: first_choice,
          answered_at: Time.current
        )
      end

      let!(:second_history) do
        create(
          :question_history,
          user: user,
          task: task,
          course: course,
          unit: unit,
          question: second_question,
          question_choice: second_choice,
          answered_at: Time.current
        )
      end

      let(:cookie) { login_and_get_cookie(user) }

      it '200が返る' do
        get "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/confirmation",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it '問題一覧が返る' do
        get "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/confirmation",
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json.size).to eq(2)
        expect(json.pluck('question_id')).to contain_exactly(
          first_question.id,
          second_question.id
        )
      end

      it '解答情報が返る' do
        get "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/confirmation",
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        first_result = json.find do |question|
          question['question_id'] == first_question.id
        end

        expect(first_result['selected_choice_number']).to eq(2)
        expect(first_result['status']).to eq('answered')
      end
    end

    context '異常系 - 解答履歴なし' do
      let!(:prefecture) { create(:prefecture, name: '東京都') }
      let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }

      let!(:user) { create(:user, high_school: high_school) }
      let!(:goal) { create(:goal, user: user) }

      let!(:task) { create(:task, user: user, goal: goal) }
      let!(:course) { create(:course) }
      let!(:unit) { create(:unit, course: course) }
      let!(:task_unit) { create(:task_unit, task: task, unit: unit) }

      let!(:question) { create(:question, unit: unit) }

      let(:cookie) { login_and_get_cookie(user) }

      it '404が返る' do
        get "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/confirmation",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end
    end

    context '異常系 - 未認証アクセス' do
      it '401が返る' do
        get '/api/v1/student/tasks/1/units/1/confirmation',
            headers: headers

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - teacher権限' do
      let!(:teacher) { create(:user, :teacher) }
      let(:cookie) { login_and_get_cookie(teacher) }

      it '403が返る' do
        get '/api/v1/student/tasks/1/units/1/confirmation',
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
