# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Student::Analytics', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end

  let!(:prefecture) { create(:prefecture, name: '東京都') }
  let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }
  let!(:user) { create(:user, high_school: high_school) }

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: { email: user.email, password: 'password' }.to_json,
         headers: headers

    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/student/analytics' do
    let(:cookie) { login_and_get_cookie(user) }

    context 'task_completionの場合' do
      let!(:goal) { create(:goal, user: user) }
      let!(:completed_task) { create(:task, user: user, goal: goal, status: :completed) }
      let!(:incomplete_task) { create(:task, user: user, goal: goal) }

      it 'タスク完了状況を返す' do
        get '/api/v1/student/analytics',
            params: { analytics: { type: 'task_completion' } },
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)

        json = response.parsed_body

        expect(json['completed_count']).to eq(1)
        expect(json['total_count']).to eq(2)
        expect(json['completion_rate']).to eq(50.0)
      end
    end

    context 'タスクが存在しない場合' do
      it '0件として返す' do
        get '/api/v1/student/analytics',
            params: { analytics: { type: 'task_completion' } },
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)

        json = response.parsed_body

        expect(json['completed_count']).to eq(0)
        expect(json['total_count']).to eq(0)
        expect(json['completion_rate']).to eq(0)
      end
    end

    context '全てのタスクが完了している場合' do
      let!(:goal) { create(:goal, user: user) }
      let!(:completed_task1) { create(:task, user: user, goal: goal, status: :completed) }
      let!(:completed_task2) { create(:task, user: user, goal: goal, status: :completed) }

      it '完了率100%を返す' do
        get '/api/v1/student/analytics',
            params: { analytics: { type: 'task_completion' } },
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)

        json = response.parsed_body

        expect(json['completed_count']).to eq(2)
        expect(json['total_count']).to eq(2)
        expect(json['completion_rate']).to eq(100.0)
      end
    end

    context 'understanding_scoreの場合' do
      let!(:goal) { create(:goal, user: user) }
      let!(:task) { create(:task, user: user, goal: goal) }
      let!(:math_subject) { create(:subject, name: '数学') }
      let!(:course) { create(:course, subject: math_subject, level_name: '数学Ⅰ', level_number: 1) }

      let!(:unit1) { create(:unit, course: course, unit_name: '方程式') }
      let!(:unit2) { create(:unit, course: course, unit_name: '関数') }

      before do
        create(
          :question_history,
          user: user,
          task: task,
          course: course,
          unit: unit1,
          is_correct: true
        )

        create(:question_history,
               user: user,
               task: task,
               course: course,
               unit: unit1,
               is_correct: false)

        create(:question_history,
               user: user,
               task: task,
               course: course,
               unit: unit2,
               is_correct: true)
      end

      it '理解度を返す' do
        get '/api/v1/student/analytics',
            params: { analytics: { type: 'understanding_score' } },
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)

        json = response.parsed_body

        expect(json['subjects'].size).to eq(1)

        subject = json['subjects'].first
        expect(subject['subject_name']).to eq('数学')

        course = subject['courses'].first
        expect(course['level_name']).to eq('数学Ⅰ')

        expect(course['units'][0]['unit_name']).to eq('方程式')
        expect(course['units'][0]['score']).to eq(50.0)

        expect(course['units'][1]['unit_name']).to eq('関数')
        expect(course['units'][1]['score']).to eq(100.0)
      end
    end

    context '問題履歴が存在しない場合' do
      it '空のsubjectsを返す' do
        get '/api/v1/student/analytics',
            params: { analytics: { type: 'understanding_score' } },
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)

        json = response.parsed_body

        expect(json['subjects']).to eq([])
      end
    end

    context 'grade_averageの場合' do
      let!(:grade) { user.grade }

      let!(:other_user) do
        create(
          :user,
          high_school: high_school,
          grade: grade
        )
      end

      let!(:goal) { create(:goal, user: user) }
      let!(:other_goal) { create(:goal, user: other_user) }

      let!(:my_completed_task) do
        create(:task, :completed, user: user, goal: goal)
      end
      let!(:my_incomplete_task) do
        create(:task, user: user, goal: goal)
      end

      let!(:other_completed_task) do
        create(:task, :completed, user: other_user, goal: other_goal)
      end

      let!(:math_subject) { create(:subject) }
      let!(:course) { create(:course, subject: math_subject) }
      let!(:unit) { create(:unit, course: course) }

      before do
        # 自分：2問中1問正解 → 50%
        create(:question_history,
               user: user,
               task: my_completed_task,
               course: course,
               unit: unit,
               is_correct: true)

        create(:question_history,
               user: user,
               task: my_completed_task,
               course: course,
               unit: unit,
               is_correct: false)

        # 他ユーザー：2問とも正解 →100%
        create(:question_history,
               user: other_user,
               task: other_completed_task,
               course: course,
               unit: unit,
               is_correct: true)

        create(:question_history,
               user: other_user,
               task: other_completed_task,
               course: course,
               unit: unit,
               is_correct: true)
      end

      it '学年平均との差を返す' do
        get '/api/v1/student/analytics',
            params: { analytics: { type: 'grade_average' } },
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)

        json = response.parsed_body

        expect(json['correct_rate']['my']).to eq(50.0)
        expect(json['correct_rate']['average']).to eq(75.0)

        expect(json['task_completion_rate']['my']).to eq(50.0)
        expect(json['task_completion_rate']['average']).to eq(66.7)
      end
    end

    context 'course_rankの場合' do
      let!(:other_user1) { create(:user, high_school: high_school) }
      let!(:other_user2) { create(:user, high_school: high_school) }

      let!(:goal) { create(:goal, user: user) }
      let!(:goal2) { create(:goal, user: other_user1) }
      let!(:goal3) { create(:goal, user: other_user2) }

      let!(:task1) { create(:task, user: user, goal: goal) }
      let!(:task2) { create(:task, user: other_user1, goal: goal2) }
      let!(:task3) { create(:task, user: other_user2, goal: goal3) }

      let!(:math_subject) { create(:subject) }
      let!(:course) { create(:course, subject: math_subject) }
      let!(:unit) { create(:unit, course: course) }

      before do
        # user: 50% (1/2)
        create(:question_history,
               user: user,
               task: task1,
               course: course,
               unit: unit,
               is_correct: true)

        create(:question_history,
               user: user,
               task: task1,
               course: course,
               unit: unit,
               is_correct: false)

        # other_user1: 100% (2/2)
        create(:question_history,
               user: other_user1,
               task: task2,
               course: course,
               unit: unit,
               is_correct: true)

        create(:question_history,
               user: other_user1,
               task: task2,
               course: course,
               unit: unit,
               is_correct: true)

        # other_user2: 0% (0/2)
        create(:question_history,
               user: other_user2,
               task: task3,
               course: course,
               unit: unit,
               is_correct: false)

        create(:question_history,
               user: other_user2,
               task: task3,
               course: course,
               unit: unit,
               is_correct: false)
      end

      it 'コース順位を返す' do
        get '/api/v1/student/analytics',
            params: {
              analytics: { type: 'course_rank' },
              course_id: course.id
            },
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)

        json = response.parsed_body

        expect(json['rank']).to eq(2)
        expect(json['total_users']).to eq(3)
      end
    end

    context 'unit_rankの場合' do
      let!(:other_user1) { create(:user, high_school: high_school) }
      let!(:other_user2) { create(:user, high_school: high_school) }

      let!(:goal) { create(:goal, user: user) }
      let!(:goal2) { create(:goal, user: other_user1) }
      let!(:goal3) { create(:goal, user: other_user2) }

      let!(:task1) { create(:task, user: user, goal: goal) }
      let!(:task2) { create(:task, user: other_user1, goal: goal2) }
      let!(:task3) { create(:task, user: other_user2, goal: goal3) }

      let!(:math_subject) { create(:subject) }
      let!(:course) { create(:course, subject: math_subject) }
      let!(:unit) { create(:unit, course: course) }

      before do
        # user: 50% (1/2)
        create(
          :question_history,
          user: user,
          task: task1,
          course: course,
          unit: unit,
          is_correct: true
        )

        create(
          :question_history,
          user: user,
          task: task1,
          course: course,
          unit: unit,
          is_correct: false
        )

        # other_user1: 100% (2/2)
        create(
          :question_history,
          user: other_user1,
          task: task2,
          course: course,
          unit: unit,
          is_correct: true
        )

        create(
          :question_history,
          user: other_user1,
          task: task2,
          course: course,
          unit: unit,
          is_correct: true
        )

        # other_user2: 0% (0/2)
        create(
          :question_history,
          user: other_user2,
          task: task3,
          course: course,
          unit: unit,
          is_correct: false
        )

        create(
          :question_history,
          user: other_user2,
          task: task3,
          course: course,
          unit: unit,
          is_correct: false
        )
      end

      it '単元順位を返す' do
        get '/api/v1/student/analytics',
            params: {
              analytics: { type: 'unit_rank' },
              unit_id: unit.id
            },
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)

        json = response.parsed_body

        expect(json['rank']).to eq(2)
        expect(json['total_users']).to eq(3)
      end
    end
  end
end
