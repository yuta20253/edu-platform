# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Units', type: :request do
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

  describe 'GET /api/v1/admin/courses/:course_id/units/:id' do
    context '正常系' do
      subject do
        get "/api/v1/admin/courses/#{course.id}/units/#{unit.id}",
            headers: headers.merge('Cookie' => cookie)
      end

      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let!(:course)     { create(:course) }
      let!(:unit)       { create(:unit, course: course, unit_name: '単元A') }

      let(:cookie) { login_and_get_cookie(admin_user) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it '基本フィールドが含まれる' do
        subject
        expect(response.parsed_body.keys).to include(
          'id', 'course_id', 'unit_name', 'questions', 'recent_import_histories'
        )
      end

      it 'id / course_id / unit_name が正しい' do
        subject
        body = response.parsed_body
        expect(body['id']).to eq(unit.id)
        expect(body['course_id']).to eq(course.id)
        expect(body['unit_name']).to eq('単元A')
      end

      context 'questions が存在する場合' do
        let!(:question1) do
          create(:question, unit: unit, question_text: '問題1', correct_answer: '2')
        end
        let!(:question2) do
          create(:question, unit: unit, question_text: '問題2', correct_answer: '3')
        end
        let!(:choice1_b) { create(:question_choice, question: question1, choice_number: 2, choice_text: 'B') }
        let!(:choice1_a) { create(:question_choice, question: question1, choice_number: 1, choice_text: 'A') }
        let!(:hint1_step2) { create(:question_hint, question: question1, step_number: 2, hint_text: 'ヒント2') }
        let!(:hint1_step1) { create(:question_hint, question: question1, step_number: 1, hint_text: 'ヒント1') }
        let!(:explanation1) do
          create(:question_explanation,
                 question: question1,
                 explanation_type: QuestionExplanation::BASIC,
                 explanation_text: '基本解説テキスト')
        end

        it 'questions は id 昇順で全件返る' do
          subject
          ids = response.parsed_body['questions'].pluck('id')
          expect(ids).to eq([question1.id, question2.id])
        end

        it '各 question に id / question_text / correct_answer / choices / hints / explanations が含まれる' do
          subject
          q = response.parsed_body['questions'].first
          expect(q.keys).to include('id', 'question_text', 'correct_answer', 'choices', 'hints', 'explanations')
          expect(q['question_text']).to eq('問題1')
          expect(q['correct_answer']).to eq('2')
        end

        it 'choices は choice_number 昇順で id / choice_number / choice_text を含む' do
          subject
          choices = response.parsed_body['questions'].first['choices']
          expect(choices.pluck('choice_number')).to eq([1, 2])
          expect(choices.first.keys).to include('id', 'choice_number', 'choice_text')
        end

        it 'hints は step_number 昇順で id / step_number / hint_text を含む' do
          subject
          hints = response.parsed_body['questions'].first['hints']
          expect(hints.pluck('step_number')).to eq([1, 2])
          expect(hints.first.keys).to include('id', 'step_number', 'hint_text')
        end

        it 'explanations は id / explanation_type / explanation_text を含む' do
          subject
          explanations = response.parsed_body['questions'].first['explanations']
          expect(explanations.first.keys).to include('id', 'explanation_type', 'explanation_text')
          expect(explanations.first['explanation_type']).to eq(QuestionExplanation::BASIC)
          expect(explanations.first['explanation_text']).to eq('基本解説テキスト')
        end
      end

      context 'recent_import_histories' do
        let(:base_time) { Time.zone.local(2026, 4, 1, 9, 0, 0) }
        let!(:histories) do
          Array.new(6) do |i|
            create(:import_history,
                   user: admin_user,
                   unit: unit,
                   file_name: "questions_#{i}.csv",
                   started_at: base_time + i.hours)
          end
        end

        it '最大 5 件、started_at の降順で返る' do
          subject
          body = response.parsed_body
          expect(body['recent_import_histories'].size).to eq(5)
          file_names = body['recent_import_histories'].pluck('file_name')
          expect(file_names).to eq(
            %w[questions_5.csv questions_4.csv questions_3.csv questions_2.csv questions_1.csv]
          )
        end

        it '必要なフィールドが含まれる' do
          subject
          h = response.parsed_body['recent_import_histories'].first
          expect(h.keys).to include(
            'id', 'file_name', 'status', 'total_count', 'success_count', 'error_count', 'created_at'
          )
        end
      end
    end

    context '異常系 - 未認証アクセス' do
      let!(:course) { create(:course) }
      let!(:unit)   { create(:unit, course: course) }

      it '401が返される' do
        get "/api/v1/admin/courses/#{course.id}/units/#{unit.id}", headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 管理者以外のアクセス（生徒）' do
      let!(:student_user) { create(:user) }
      let!(:course)       { create(:course) }
      let!(:unit)         { create(:unit, course: course) }

      it '403が返される' do
        cookie = login_and_get_cookie(student_user)
        get "/api/v1/admin/courses/#{course.id}/units/#{unit.id}",
            headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end

    context '異常系 - 管理者以外のアクセス（教員）' do
      let!(:teacher_user) { create(:user, :teacher) }
      let!(:course)       { create(:course) }
      let!(:unit)         { create(:unit, course: course) }

      it '403が返される' do
        cookie = login_and_get_cookie(teacher_user)
        get "/api/v1/admin/courses/#{course.id}/units/#{unit.id}",
            headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end

    context '異常系 - 存在しない unit_id' do
      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let!(:course)     { create(:course) }
      let(:cookie)      { login_and_get_cookie(admin_user) }

      it '404が返される' do
        get "/api/v1/admin/courses/#{course.id}/units/0",
            headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:not_found)
      end
    end

    context '異常系 - course_id と unit.course_id が不整合' do
      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let!(:course)     { create(:course) }
      let!(:other_course) { create(:course) }
      let!(:unit) { create(:unit, course: other_course) }
      let(:cookie) { login_and_get_cookie(admin_user) }

      it '404が返される' do
        get "/api/v1/admin/courses/#{course.id}/units/#{unit.id}",
            headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
