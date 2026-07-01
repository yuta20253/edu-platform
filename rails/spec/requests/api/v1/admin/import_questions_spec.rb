# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::ImportQuestions', type: :request do
  include ActiveJob::TestHelper

  let(:json_headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: { email: user.email, password: 'password' }.to_json,
         headers: json_headers
    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'POST /api/v1/admin/courses/:course_id/units/:unit_id/import_questions' do
    subject(:post_import) do
      post "/api/v1/admin/courses/#{course.id}/units/#{unit.id}/import_questions",
           params: params,
           headers: { 'Accept' => 'application/json', 'Cookie' => cookie }
    end

    let!(:admin_user) { create(:user, :admin, high_school: nil) }
    let!(:course)     { create(:course) }
    let!(:unit)       { create(:unit, course: course) }
    let(:cookie)      { login_and_get_cookie(admin_user) }

    let(:file) { fixture_file_upload('questions.csv', 'text/csv') }
    let(:params) { { file: file, mode: mode } }

    around do |example|
      perform_enqueued_jobs_was = ActiveJob::Base.queue_adapter
      ActiveJob::Base.queue_adapter = :test
      example.run
      ActiveJob::Base.queue_adapter = perform_enqueued_jobs_was
    end

    context 'mode を指定しない場合' do
      let(:params) { { file: file } }

      it 'ステータス202が返り append で保存される' do
        post_import
        expect(response).to have_http_status(:accepted)
        expect(ImportHistory.last.mode).to eq('append')
      end

      it 'インポートジョブがenqueueされる' do
        post_import
        expect(Admin::QuestionCsvImportJob).to have_been_enqueued.with(ImportHistory.last.id)
      end
    end

    context 'mode=append の場合' do
      let(:mode) { 'append' }

      it 'append で保存される' do
        post_import
        expect(response).to have_http_status(:accepted)
        expect(ImportHistory.last.mode).to eq('append')
      end
    end

    context 'mode=overwrite の場合' do
      let(:mode) { 'overwrite' }

      it 'overwrite で保存される' do
        post_import
        expect(response).to have_http_status(:accepted)
        expect(ImportHistory.last.mode).to eq('overwrite')
      end
    end

    context '不正な mode の場合' do
      let(:mode) { 'invalid_mode' }

      it 'append にフォールバックして保存される' do
        post_import
        expect(response).to have_http_status(:accepted)
        expect(ImportHistory.last.mode).to eq('append')
      end
    end

    context 'CSV以外のファイルをアップロードした場合' do
      let(:file) { fixture_file_upload('questions.csv', 'text/plain') }
      let(:mode) { 'append' }

      it 'ステータス422が返る' do
        post_import
        expect(response).to have_http_status(:unprocessable_content)
      end
    end
  end
end
