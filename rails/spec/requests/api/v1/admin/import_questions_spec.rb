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

    context 'unit が course に属さない場合' do
      let(:mode) { 'append' }
      let!(:other_course) { create(:course) }
      let!(:unit)         { create(:unit, course: other_course) }

      it 'ステータス404が返り ImportHistory は作成されない' do
        expect { post_import }.not_to change(ImportHistory, :count)
        expect(response).to have_http_status(:not_found)
      end
    end

    context '存在しない unit を指定した場合' do
      subject(:post_import) do
        post "/api/v1/admin/courses/#{course.id}/units/0/import_questions",
             params: params,
             headers: { 'Accept' => 'application/json', 'Cookie' => cookie }
      end

      let(:mode) { 'append' }

      it 'ステータス404が返る' do
        post_import
        expect(response).to have_http_status(:not_found)
      end
    end

    context 'body の unit_id で別単元を差し替えようとした場合' do
      let(:mode) { 'overwrite' }
      let!(:victim_course) { create(:course) }
      let!(:victim_unit)   { create(:unit, course: victim_course) }
      let!(:victim_question) { create(:question, unit: victim_unit) }
      let(:params) { { file: file, mode: mode, unit_id: victim_unit.id } }

      it 'route の unit が使われ body の unit_id は無視される' do
        post_import
        expect(response).to have_http_status(:accepted)
        expect(ImportHistory.last.unit_id).to eq(unit.id)
      end

      it '別単元(victim)の問題は削除されない' do
        perform_enqueued_jobs { post_import }
        expect(victim_question.reload.deleted_at).to be_nil
      end
    end
  end
end
