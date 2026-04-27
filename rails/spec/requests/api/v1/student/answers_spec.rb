# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Student::Answers', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  let!(:prefecture) { create(:prefecture, name: '東京都') }
  let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }
  let!(:user) { create(:user, high_school: high_school) }
  let!(:goal) { create(:goal, user: user) }
  let!(:course) { create(:course) }
  let!(:unit) { create(:unit, course: course) }
  let!(:task) { create(:task, user: user, goal: goal, units: [unit]) }

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: { email: user.email, password: 'password' }.to_json,
         headers: headers

    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'POST /api/v1/student/tasks/:task_id/units/:unit_id/answers' do
    let(:cookie) { login_and_get_cookie(user) }

    let(:params) do
      {
        task_id: task.id,
        unit_id: unit.id,
        question_id: 1,
        question_choice_id: 1,
        answer_text: 'A',
        time_spent_sec: 30,
        is_correct: true,
        explanation_viewed: false
      }
    end

    context '正常系' do
      let(:form) do
        instance_double(
          Student::CreateQuestionHistoryForm,
          save: true
        )
      end

      before do
        allow(Student::CreateQuestionHistoryForm)
          .to receive(:new)
          .and_return(form)
      end

      it '201が返る' do
        post "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/answers",
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:created)
      end

      it '成功メッセージが返る' do
        post "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/answers",
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response.parsed_body['message'])
          .to eq('解答結果の保存に成功しました')
      end

      it 'Form object が正しい引数で呼ばれる' do
        post "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/answers",
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(Student::CreateQuestionHistoryForm)
          .to have_received(:new)
          .with(
            current_user: user,
            task_id: task.id.to_s,
            unit_id: unit.id.to_s,
            question_id: 1,
            question_choice_id: 1,
            answer_text: 'A',
            time_spent_sec: 30,
            is_correct: true,
            explanation_viewed: false
          )
      end
    end

    context '異常系 - バリデーションエラー' do
      let(:form) do
        instance_double(
          Student::CreateQuestionHistoryForm,
          save: false,
          errors: ['error']
        )
      end

      before do
        allow(Student::CreateQuestionHistoryForm)
          .to receive(:new)
          .and_return(form)
      end

      it '422が返る' do
        post "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/answers",
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '異常系 - 未認証' do
      it '401が返る' do
        post "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/answers",
             params: params.to_json,
             headers: headers.merge('Cookie' => nil)

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 生徒以外' do
      let!(:teacher) { create(:user, :teacher) }
      let(:cookie) { login_and_get_cookie(teacher) }

      it '403が返る' do
        post "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/answers",
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'PATCH /api/v1/student/tasks/:task_id/units/:unit_id/answers/update' do
    let(:cookie) { login_and_get_cookie(user) }

    let(:params) do
      {
        task_id: task.id.to_s,
        unit_id: unit.id.to_s,
        question_id: 1,
        question_choice_id: 2,
        answer_text: 'B',
        time_spent_sec: 45,
        is_correct: false,
        explanation_viewed: true
      }
    end

    context '正常系' do
      let(:form) do
        instance_double(
          Student::UpdateQuestionHistoryForm,
          save: true
        )
      end

      before do
        allow(Student::UpdateQuestionHistoryForm)
          .to receive(:new)
          .and_return(form)
      end

      it '200が返る' do
        patch "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/answers",
              params: params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it '成功メッセージが返る' do
        patch "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/answers",
              params: params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response.parsed_body['message'])
          .to eq('解答結果の更新に成功しました')
      end

      it 'Form object が正しい引数で呼ばれる' do
        patch "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/answers",
              params: params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(Student::UpdateQuestionHistoryForm)
          .to have_received(:new)
          .with(
            current_user: user,
            task_id: task.id.to_s,
            unit_id: unit.id.to_s,
            question_id: 1,
            question_choice_id: 2,
            answer_text: 'B',
            time_spent_sec: 45,
            is_correct: false,
            explanation_viewed: true
          )
      end
    end

    context '異常系 - バリデーションエラー' do
      let(:form) do
        instance_double(
          Student::UpdateQuestionHistoryForm,
          save: false,
          errors: ['error']
        )
      end

      before do
        allow(Student::UpdateQuestionHistoryForm)
          .to receive(:new)
          .and_return(form)
      end

      it '422が返る' do
        patch "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/answers",
              params: params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '異常系 - 未認証' do
      it '401が返る' do
        patch "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/answers",
              params: params.to_json,
              headers: headers.merge('Cookie' => nil)

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 生徒以外' do
      let!(:teacher) { create(:user, :teacher) }
      let(:cookie) { login_and_get_cookie(teacher) }

      it '403が返る' do
        patch "/api/v1/student/tasks/#{task.id}/units/#{unit.id}/answers",
              params: params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
