# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Teacher::ImportHistories', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  let!(:high_school) { create(:high_school) }
  let!(:teacher) { create(:user, :teacher, high_school: high_school) }
  let(:cookie) { login_and_get_cookie(teacher) }

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: { email: user.email, password: 'password' }.to_json,
         headers: headers
    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/teacher/import_histories' do
    subject { get '/api/v1/teacher/import_histories', headers: headers.merge('Cookie' => cookie) }

    context '自分の生徒インポート履歴が存在する場合' do
      let!(:mine) { create(:import_history, user: teacher, unit: nil, import_type: :student, status: :completed) }

      it 'ステータス200で、その履歴が含まれる' do
        subject
        expect(response).to have_http_status(:ok)
        ids = response.parsed_body['import_histories'].pluck('id')
        expect(ids).to contain_exactly(mine.id)
      end
    end

    context '他の教員が実行した履歴が存在する場合' do
      let!(:other_teacher) { create(:user, :teacher, high_school: create(:high_school)) }
      let!(:others) { create(:import_history, user: other_teacher, unit: nil, import_type: :student) }

      it '結果に含まれない' do
        subject
        ids = response.parsed_body['import_histories'].pluck('id')
        expect(ids).not_to include(others.id)
      end
    end

    context '自分が実行した問題インポート(生徒インポートではない)履歴が存在する場合' do
      let!(:question_import) { create(:import_history, user: teacher, import_type: :question) }

      it '結果に含まれない' do
        subject
        ids = response.parsed_body['import_histories'].pluck('id')
        expect(ids).not_to include(question_import.id)
      end
    end

    context '未ログインの場合' do
      let(:cookie) { nil }

      it '401が返される' do
        subject
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '生徒でログインした場合' do
      let!(:student_user) { create(:user, :student, high_school: high_school) }
      let(:cookie) { login_and_get_cookie(student_user) }

      it '403が返される' do
        subject
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'GET /api/v1/teacher/import_histories/:id' do
    subject { get "/api/v1/teacher/import_histories/#{history.id}", headers: headers.merge('Cookie' => cookie) }

    let!(:grade) { create(:grade, high_school: high_school, year: 1) }
    let!(:school_class) { create(:school_class, grade: grade, name: 'A組') }
    let!(:history) { create(:import_history, user: teacher, unit: nil, import_type: :student, status: :completed) }

    context '成功行・失敗行が存在する場合' do
      let!(:student) do
        create(:user, :student, high_school: high_school, grade: grade, school_class: school_class,
                                name: '山田太郎', student_number: 'TST-ABC123')
      end

      before do
        ImportedStudent.create!(import_history: history, user: student, action: :created)
        create(:import_error, import_history: history, row_number: 3, message: '氏名は必須です')
      end

      it 'ステータス200で、生徒情報とエラー情報が含まれる' do
        subject
        expect(response).to have_http_status(:ok)
        body = response.parsed_body

        expect(body['students']).to contain_exactly(
          hash_including(
            'name' => '山田太郎',
            'student_number' => 'TST-ABC123',
            'grade' => '高１生',
            'school_class' => 'A組',
            'action' => 'created'
          )
        )
        expect(body['errors']).to contain_exactly(
          hash_including('row_number' => 3, 'message' => '氏名は必須です')
        )
      end
    end

    context '他の教員が実行した履歴の場合' do
      let!(:other_teacher) { create(:user, :teacher, high_school: create(:high_school)) }
      let(:history) { create(:import_history, user: other_teacher, unit: nil, import_type: :student) }

      it '404が返される' do
        subject
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'GET /api/v1/teacher/import_histories/:id/export' do
    subject { get "/api/v1/teacher/import_histories/#{history.id}/export", headers: headers.merge('Cookie' => cookie) }

    let!(:grade) { create(:grade, high_school: high_school, year: 1) }
    let!(:school_class) { create(:school_class, grade: grade, name: 'A組') }
    let!(:history) { create(:import_history, user: teacher, unit: nil, import_type: :student, status: :completed) }
    let!(:student) do
      create(:user, :student, high_school: high_school, grade: grade, school_class: school_class,
                              name: '山田太郎', student_number: 'TST-ABC123')
    end

    before { ImportedStudent.create!(import_history: history, user: student, action: :created) }

    it 'CSVファイルとしてダウンロードできる' do
      subject
      expect(response).to have_http_status(:ok)
      expect(response.headers['Content-Type']).to include('text/csv')
      expect(response.headers['Content-Disposition']).to include('attachment')
      expect(response.body).to include('山田太郎', 'TST-ABC123')
    end

    context '他の教員が実行した履歴の場合' do
      let!(:other_teacher) { create(:user, :teacher, high_school: create(:high_school)) }
      let(:history) { create(:import_history, user: other_teacher, unit: nil, import_type: :student) }

      it '404が返される' do
        subject
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
