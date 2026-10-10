# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Teacher::Students', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  let!(:prefecture) { create(:prefecture) }
  let!(:high_school) { create(:high_school, prefecture: prefecture) }
  let!(:teacher) do
    create(:user, :teacher, high_school: high_school)
  end
  let!(:teacher_permission) do
    create(
      :teacher_permission,
      user: teacher,
      grade_scope: :all_grades
    )
  end
  let!(:cookie) { login_and_get_cookie(teacher) }

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: { email: user.email, password: 'password' }.to_json,
         headers: headers

    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/teacher/students' do
    subject do
      get '/api/v1/teacher/students',
          headers: headers.merge('Cookie' => cookie)
    end

    before do
      create_list(:user, 15, :student, high_school: high_school)
    end

    it '200が返る' do
      subject

      expect(response).to have_http_status(:ok)
    end

    it 'studentsが返る' do
      subject

      expect(response.parsed_body).to have_key('students')
    end

    it 'metaが返る' do
      subject

      expect(response.parsed_body).to have_key('meta')
    end

    it 'デフォルトの件数が10件' do
      subject

      expect(response.parsed_body['meta']['per_page']).to eq(10)
      expect(response.parsed_body['students'].size).to eq(10)
    end

    it 'per_pageを指定できる' do
      get '/api/v1/teacher/students',
          params: { per_page: 5 },
          headers: headers.merge('Cookie' => cookie)

      expect(response.parsed_body['meta']['per_page']).to eq(5)
    end
  end

  describe 'POST /api/v1/teacher/students' do
    subject do
      post '/api/v1/teacher/students',
           params: params.to_json,
           headers: headers.merge('Cookie' => cookie)
    end

    let!(:other_high_school) { create(:high_school, prefecture: prefecture) }
    let!(:grade) { create(:grade, high_school: high_school, year: 1) }
    let!(:other_school_grade) { create(:grade, high_school: other_high_school, year: 1) }
    let!(:school_class) { create(:school_class, grade: grade, name: 'A組') }

    let(:params) do
      {
        user: {
          name: '山田 太郎',
          name_kana: 'ヤマダ タロウ',
          email: 'yamada@example.com',
          grade_id: grade.id,
          school_class_id: school_class.id
        }
      }
    end

    context '入力値が正常な場合' do
      it '生徒を新規作成し、201とmessageを返すこと' do
        expect { subject }.to change(User, :count).by(1)
                                                  .and have_enqueued_mail(AuthMailer, :invite_user)

        expect(response).to have_http_status(:created)
        expect(response.parsed_body['message']).to eq('生徒の新規作成に成功しました。')

        student = User.find_by(email: 'yamada@example.com')

        expect(student).to be_present
        expect(student.high_school).to eq(high_school)
        expect(student.grade).to eq(grade)
        expect(student.school_class).to eq(school_class)
        expect(student.student_number).to be_present
      end
    end

    context '他校のgrade_idを指定した場合' do
      let(:params) do
        {
          user: {
            name: '山田 太郎',
            name_kana: 'ヤマダ タロウ',
            email: 'yamada@example.com',
            grade_id: other_school_grade.id,
            school_class_id: school_class.id
          }
        }
      end

      it '422が返り、生徒が作成されないこと' do
        expect { subject }.not_to change(User, :count)

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body['errors']).to be_present
      end
    end

    context 'own_gradeの教員が担当外学年を指定した場合' do
      let!(:teacher_permission) do
        create(:teacher_permission, user: teacher, grade_scope: :own_grade)
      end
      let!(:other_grade) { create(:grade, high_school: high_school, year: 2) }
      let!(:other_grade_school_class) { create(:school_class, grade: other_grade, name: 'A組') }

      let(:params) do
        {
          user: {
            name: '山田 太郎',
            name_kana: 'ヤマダ タロウ',
            email: 'yamada@example.com',
            grade_id: other_grade.id,
            school_class_id: other_grade_school_class.id
          }
        }
      end

      it '422が返り、生徒が作成されないこと' do
        expect { subject }.not_to change(User, :count)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '非教員がAPIを実行した場合' do
      let!(:student) { create(:user, :student, high_school: high_school) }
      let!(:cookie) { login_and_get_cookie(student) }

      it '403が返ること' do
        subject

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'GET /api/v1/teacher/students/:id' do
    subject(:request_show) do
      get "/api/v1/teacher/students/#{student.id}",
          params: params,
          headers: headers.merge('Cookie' => cookie)
    end

    let!(:own_grade) { create(:grade, high_school: high_school, year: 1) }
    let!(:student) { create(:user, :student, high_school: high_school, grade: own_grade, name: '生徒 花子') }
    let!(:other_student) { create(:user, :student, high_school: high_school, grade: own_grade) }
    let(:params) { {} }
    let(:body) { response.parsed_body }

    shared_examples 'プロフィールを返す' do
      it '200で、StudentSerializerの出力をトップレベルに返す(既存の挙動のまま)' do
        request_show

        expect(response).to have_http_status(:ok)
        expect(body['id']).to eq(student.id)
        expect(body['name']).to eq('生徒 花子')
        expect(body.keys).to include('name_kana', 'email', 'profile_completed', 'grade', 'high_school')
        expect(body.keys).not_to include('student', 'goals', 'tasks')
      end
    end

    context 'tabを指定しない場合' do
      it_behaves_like 'プロフィールを返す'
    end

    context 'tab=profileの場合' do
      let(:params) { { tab: 'profile' } }

      it_behaves_like 'プロフィールを返す'
    end

    context '想定外のtabを指定した場合' do
      let(:params) { { tab: 'unknown' } }

      it_behaves_like 'プロフィールを返す'
    end

    context 'tab=goalsの場合' do
      let(:params) { { tab: 'goals' } }

      let!(:goal_late) { create(:goal, user: student, due_date: Date.new(2026, 12, 31)) }
      let!(:goal_early) { create(:goal, user: student, due_date: Date.new(2026, 11, 30)) }
      let!(:other_students_goal) { create(:goal, user: other_student) }
      let!(:deleted_goal) { create(:goal, user: student, deleted_at: Time.current) }

      before do
        create(:task, :completed, user: student, goal: goal_early)
        create(:task, user: student, goal: goal_early)
        create(:task, user: student, goal: goal_late)
      end

      it '200で、生徒のidとnameを返す' do
        request_show

        expect(response).to have_http_status(:ok)
        expect(body['student']).to eq('id' => student.id, 'name' => '生徒 花子')
      end

      it 'この生徒の目標だけを期限の近い順に返す(論理削除済みは含まない)' do
        request_show

        expect(body['goals'].pluck('id')).to eq([goal_early.id, goal_late.id])
      end

      it '目標ごとのタスク完了率を返す' do
        request_show
        goal_json = body['goals'].find { |goal| goal['id'] == goal_early.id }

        expect(goal_json['progress']).to eq(
          'task_completed_count' => 1, 'task_total_count' => 2, 'completion_rate' => 50.0
        )
      end

      it 'tasksとmetaは返さない' do
        request_show

        expect(body.keys).to contain_exactly('student', 'goals')
      end

      it '目標の数に関係なく、tasksの取得は1クエリ(N+1にならない)' do
        create_list(:goal, 3, user: student).each { |goal| create(:task, user: student, goal: goal) }

        task_queries = capture_queries { request_show }.grep(/FROM `tasks`/i)

        expect(task_queries.size).to eq(1)
      end
    end

    context 'tab=tasksの場合' do
      let(:params) { { tab: 'tasks' } }

      let!(:goal) { create(:goal, user: student, title: '数学の基礎を固める') }
      let!(:course) { create(:course) }
      let!(:unit_one) { create(:unit, course: course) }
      let!(:unit_two) { create(:unit, course: course) }
      let!(:question_one) { create(:question, unit: unit_one) }
      let!(:question_two) { create(:question, unit: unit_one) }
      let!(:question_three) { create(:question, unit: unit_two) }

      let!(:task_late) do
        create(:task, :completed, user: student, goal: goal, due_date: Date.new(2026, 11, 20))
      end
      let!(:task_early) { create(:task, user: student, goal: goal, due_date: Date.new(2026, 11, 1)) }
      let!(:other_students_task) { create(:task, user: other_student, goal: create(:goal, user: other_student)) }

      before do
        create(:task_unit, task: task_early, unit: unit_one)
        create(:task_unit, task: task_early, unit: unit_two)
        create(:task_unit, task: task_late, unit: unit_two)
        create_answer!(user: student, task: task_early, question: question_one, is_correct: true)
        create_answer!(user: student, task: task_early, question: question_two, is_correct: false)
      end

      it '200で、生徒のidとnameを返す' do
        request_show

        expect(response).to have_http_status(:ok)
        expect(body['student']).to eq('id' => student.id, 'name' => '生徒 花子')
      end

      it 'この生徒のタスクを、完了済みも含めて期限の近い順に返す' do
        request_show

        expect(body['tasks'].pluck('id')).to eq([task_early.id, task_late.id])
      end

      it 'タスク単位とUnit単位の解答状況を返す' do
        request_show
        task_json = body['tasks'].find { |task| task['id'] == task_early.id }
        units_by_id = task_json['units'].index_by { |unit| unit['id'] }

        expect(task_json['progress']).to eq(
          'total_questions' => 3, 'answered_count' => 2, 'correct_count' => 1,
          'progress_rate' => 66.7, 'correct_rate' => 50.0
        )
        expect(units_by_id[unit_one.id]).to include(
          'total_questions' => 2, 'answered_count' => 2, 'correct_count' => 1,
          'progress_rate' => 100.0, 'correct_rate' => 50.0
        )
        expect(units_by_id[unit_two.id]).to include(
          'total_questions' => 1, 'answered_count' => 0, 'correct_count' => 0,
          'progress_rate' => 0, 'correct_rate' => nil
        )
      end

      it '紐づく目標のidとtitleを返す' do
        request_show
        task_json = body['tasks'].find { |task| task['id'] == task_early.id }

        expect(task_json['goal']).to eq('id' => goal.id, 'title' => '数学の基礎を固める')
      end

      it 'ページネーションのmetaを返す(既定は1ページ10件)' do
        request_show

        expect(body['meta']).to eq(
          'current_page' => 1, 'total_pages' => 1, 'total_count' => 2, 'per_page' => 10
        )
      end

      context 'pageとper_pageを指定した場合' do
        let(:params) { { tab: 'tasks', page: 2, per_page: 1 } }

        it '指定したページのタスクだけを返す' do
          request_show

          expect(body['tasks'].pluck('id')).to eq([task_late.id])
          expect(body['meta']).to include('current_page' => 2, 'total_pages' => 2, 'per_page' => 1)
        end
      end

      it 'goalsは返さない' do
        request_show

        expect(body.keys).to contain_exactly('student', 'tasks', 'meta')
      end

      it 'タスクの数に関係なく、解答履歴と問題数の集計は1クエリずつ(N+1にならない)' do
        create_list(:task, 3, user: student, goal: goal).each do |task|
          create(:task_unit, task: task, unit: unit_one)
        end

        queries = capture_queries { request_show }

        expect(queries.grep(/FROM `question_histories`/i).size).to eq(1)
        expect(queries.grep(/FROM `questions`/i).size).to eq(1)
      end
    end

    describe '閲覧できない生徒へのアクセス' do
      %w[profile goals tasks].each do |tab|
        context "tab=#{tab}で他校の生徒を指定した場合" do
          let(:params) { { tab: tab } }
          let!(:other_high_school) { create(:high_school, prefecture: prefecture) }
          let!(:student) { create(:user, :student, high_school: other_high_school) }

          it '404が返る' do
            request_show

            expect(response).to have_http_status(:not_found)
          end
        end

        context "tab=#{tab}で、own_gradeの教員が担当外学年の生徒を指定した場合" do
          let(:params) { { tab: tab } }
          let!(:teacher_permission) { create(:teacher_permission, user: teacher, grade_scope: :own_grade) }
          let!(:other_grade) { create(:grade, high_school: high_school, year: 2) }
          let!(:student) { create(:user, :student, high_school: high_school, grade: other_grade) }

          before { teacher.update!(grade: own_grade) }

          it '404が返る' do
            request_show

            expect(response).to have_http_status(:not_found)
          end
        end
      end

      context 'own_gradeの教員が担当学年の生徒を指定した場合' do
        let(:params) { { tab: 'tasks' } }
        let!(:teacher_permission) { create(:teacher_permission, user: teacher, grade_scope: :own_grade) }

        before { teacher.update!(grade: own_grade) }

        it '200が返る' do
          request_show

          expect(response).to have_http_status(:ok)
        end
      end
    end

    context '非教員がAPIを実行した場合' do
      let!(:cookie) { login_and_get_cookie(other_student) }
      let(:params) { { tab: 'goals' } }

      it '403が返る' do
        request_show

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
