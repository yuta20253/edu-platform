# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Teacher::ImportStudents', type: :request do
  include ActiveJob::TestHelper

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: { email: user.email, password: 'password' }.to_json,
         headers: headers
    response.headers['Set-Cookie']&.split(';')&.first
  end

  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  let!(:student_role) { create(:user_role, :student) }
  let!(:high_school) { create(:high_school) }
  let!(:grade) { create(:grade, high_school: high_school, year: 1) }
  let!(:school_class) { create(:school_class, grade: grade, name: 'A組') }
  let!(:teacher) { create(:user, :teacher, high_school: high_school) }
  let(:cookie) { login_and_get_cookie(teacher) }
  let(:file) { fixture_file_upload('students.csv', 'text/csv') }

  around do |example|
    original_adapter = ActiveJob::Base.queue_adapter
    ActiveJob::Base.queue_adapter = :test
    example.run
    ActiveJob::Base.queue_adapter = original_adapter
  end

  describe 'POST /api/v1/teacher/import_students' do
    subject(:post_import) do
      post '/api/v1/teacher/import_students',
           params: params,
           headers: { 'Accept' => 'application/json', 'Cookie' => cookie }
    end

    let(:params) { { file: file } }

    context '正常系' do
      it 'ステータス202が返る' do
        post_import
        expect(response).to have_http_status(:accepted)
      end

      it 'import_type: student のImportHistoryが作成される' do
        post_import
        expect(ImportHistory.last.import_type).to eq('student')
      end

      it 'modeを指定しない場合はappendで保存される' do
        post_import
        expect(ImportHistory.last.mode).to eq('append')
      end

      it 'インポートジョブがenqueueされる' do
        post_import
        expect(Teacher::StudentCsvImportJob).to have_been_enqueued.with(ImportHistory.last.id)
      end

      it 'ジョブを実行すると自校のUserが作成される' do
        perform_enqueued_jobs { post_import }
        expect(User.find_by(email: 'taro@example.com')&.high_school).to eq(high_school)
      end
    end

    context 'CSV以外のファイルをアップロードした場合' do
      let(:file) { fixture_file_upload('students.csv', 'text/plain') }

      it 'ステータス422が返りImportHistoryが作成されない' do
        expect { post_import }.not_to change(ImportHistory, :count)
        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '未認証の場合' do
      it 'ステータス401が返る' do
        post '/api/v1/teacher/import_students', params: params, headers: { 'Accept' => 'application/json' }
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '生徒からのアクセスの場合' do
      let!(:student_user) { create(:user, :student, high_school: high_school, grade: grade) }
      let(:cookie) { login_and_get_cookie(student_user) }

      it 'ステータス403が返る' do
        post_import
        expect(response).to have_http_status(:forbidden)
      end
    end

    context '保護者からのアクセスの場合' do
      let!(:guardian_user) { create(:user, :guardian, high_school: nil, grade: nil) }
      let(:cookie) { login_and_get_cookie(guardian_user) }

      it 'ステータス403が返る' do
        post_import
        expect(response).to have_http_status(:forbidden)
      end
    end

    context '管理者からのアクセスの場合' do
      let!(:admin_user) { create(:user, :admin, high_school: nil, grade: nil) }
      let(:cookie) { login_and_get_cookie(admin_user) }

      it 'ステータス403が返る' do
        post_import
        expect(response).to have_http_status(:forbidden)
      end
    end

    context 'body に high_school_id を指定しても無視される場合' do
      let!(:other_high_school) { create(:high_school) }
      let(:params) { { file: file, high_school_id: other_high_school.id } }

      it '実行教員の所属高校でImportHistoryが作成される（strong parametersで無視される）' do
        post_import
        expect(ImportHistory.last.user.high_school_id).to eq(high_school.id)
      end
    end
  end

  describe 'POST /api/v1/teacher/import_students/dry_run' do
    subject(:post_dry_run) do
      post '/api/v1/teacher/import_students/dry_run',
           params: params,
           headers: { 'Accept' => 'application/json', 'Cookie' => cookie }
    end

    let(:params) { { file: file } }

    context '全行成功するCSVの場合' do
      it 'ステータス200が返り検証結果が返る' do
        post_dry_run
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body).to eq(
          'total_count' => 1,
          'valid_count' => 1,
          'rows' => []
        )
      end

      it 'ImportHistoryが作成されない' do
        expect { post_dry_run }.not_to change(ImportHistory, :count)
      end

      it 'Userが作成されない' do
        expect { post_dry_run }.not_to change(User, :count)
      end

      it 'インポートジョブがenqueueされない' do
        post_dry_run
        expect(Teacher::StudentCsvImportJob).not_to have_been_enqueued
      end
    end

    context 'エラー行を含むCSVの場合' do
      let(:file) { fixture_file_upload('students_with_errors.csv', 'text/csv') }

      it 'ステータス200を維持しつつ該当行のみrowsに含まれる' do
        post_dry_run
        expect(response).to have_http_status(:ok)

        body = response.parsed_body
        expect(body['total_count']).to eq(3)
        expect(body['valid_count']).to eq(1)
        expect(body['rows'].size).to eq(2)
        expect(body['rows'].pluck('row_number')).to eq([3, 4])
      end

      it 'ImportHistoryが作成されない' do
        expect { post_dry_run }.not_to change(ImportHistory, :count)
      end
    end

    context 'CSV以外のファイルをアップロードした場合' do
      let(:file) { fixture_file_upload('students.csv', 'text/plain') }

      it 'ステータス422が返る' do
        post_dry_run
        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '未認証の場合' do
      it 'ステータス401が返る' do
        post '/api/v1/teacher/import_students/dry_run', params: params, headers: { 'Accept' => 'application/json' }
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '生徒からのアクセスの場合' do
      let!(:student_user) { create(:user, :student, high_school: high_school, grade: grade) }
      let(:cookie) { login_and_get_cookie(student_user) }

      it 'ステータス403が返る' do
        post_dry_run
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
