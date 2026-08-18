# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::ImportHistories', type: :request do
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

  describe 'GET /api/v1/admin/import_histories' do
    context '正常系' do
      context 'インポート履歴が存在しない場合' do
        subject { get '/api/v1/admin/import_histories', headers: headers.merge('Cookie' => cookie) }

        let!(:admin_user) { create(:user, :admin, high_school: nil) }
        let(:cookie) { login_and_get_cookie(admin_user) }

        it 'ステータス200が返される' do
          subject
          expect(response).to have_http_status(:ok)
        end

        it 'import_histories は空配列、meta は0件の値を返す' do
          subject
          body = response.parsed_body
          expect(body['import_histories']).to eq([])
          expect(body['meta']).to include(
            'current_page' => 1,
            'total_pages' => 0,
            'total_count' => 0,
            'per_page' => 20
          )
        end
      end

      context '1件の履歴が存在する場合' do
        subject { get '/api/v1/admin/import_histories', headers: headers.merge('Cookie' => cookie) }

        let!(:admin_user) { create(:user, :admin, high_school: nil) }
        let!(:executor) { create(:user, :admin, high_school: nil, name: '実行太郎') }
        let!(:course) { create(:course, level_name: '基礎英語') }
        let!(:unit) { create(:unit, course: course, unit_name: '単元1') }
        let!(:history) do
          create(:import_history, user: executor, unit: unit, status: :completed,
                                  total_count: 10, success_count: 8, error_count: 2)
        end
        let(:cookie) { login_and_get_cookie(admin_user) }

        it '必要なフィールドが含まれる' do
          subject
          item = response.parsed_body['import_histories'].first
          expect(item.keys).to include(
            'id', 'course', 'unit', 'user', 'file_name', 'status', 'mode',
            'total_count', 'success_count', 'error_count', 'created_at'
          )
        end

        it 'course / unit / user がネストされたハッシュで返る' do
          subject
          item = response.parsed_body['import_histories'].first
          expect(item['course']).to eq('id' => course.id, 'level_name' => '基礎英語')
          expect(item['unit']).to eq('id' => unit.id, 'unit_name' => '単元1')
          expect(item['user']).to eq('id' => executor.id, 'name' => '実行太郎')
        end

        it '件数系フィールドと status が正しい' do
          subject
          item = response.parsed_body['import_histories'].first
          expect(item['id']).to eq(history.id)
          expect(item['status']).to eq('completed')
          expect(item['total_count']).to eq(10)
          expect(item['success_count']).to eq(8)
          expect(item['error_count']).to eq(2)
        end

        it 'meta.total_count が1になる' do
          subject
          expect(response.parsed_body['meta']['total_count']).to eq(1)
        end
      end

      context 'ページネーション' do
        subject do
          get '/api/v1/admin/import_histories', params: query_params, headers: headers.merge('Cookie' => cookie)
        end

        let!(:admin_user) { create(:user, :admin, high_school: nil) }
        let(:cookie) { login_and_get_cookie(admin_user) }

        before { create_list(:import_history, 25) }

        context 'デフォルト per_page=20' do
          let(:query_params) { {} }

          it '20件返し、meta に current_page/per_page/total_count が入る' do
            subject
            body = response.parsed_body
            expect(body['import_histories'].size).to eq(20)
            expect(body['meta']).to include('current_page' => 1, 'per_page' => 20, 'total_count' => 25)
          end
        end

        context 'page=2 を指定' do
          let(:query_params) { { page: 2 } }

          it '残り5件を返す' do
            subject
            expect(response.parsed_body['import_histories'].size).to eq(5)
          end
        end

        context 'per_page=150 を指定（上限超過）' do
          let(:query_params) { { per_page: 150 } }

          it 'meta.per_page は100に丸められる' do
            subject
            expect(response.parsed_body['meta']['per_page']).to eq(100)
          end
        end
      end

      context 'status パラメータ指定時' do
        subject do
          get '/api/v1/admin/import_histories', params: { status: 'failed' }, headers: headers.merge('Cookie' => cookie)
        end

        let!(:admin_user) { create(:user, :admin, high_school: nil) }
        let!(:completed) { create(:import_history, status: :completed) }
        let!(:failed) { create(:import_history, status: :failed) }
        let(:cookie) { login_and_get_cookie(admin_user) }

        it '指定した status のみ返す' do
          subject
          ids = response.parsed_body['import_histories'].pluck('id')
          expect(ids).to contain_exactly(failed.id)
        end
      end

      context 'course_id パラメータ指定時' do
        subject do
          get '/api/v1/admin/import_histories', params: { course_id: course_a.id },
                                                headers: headers.merge('Cookie' => cookie)
        end

        let!(:admin_user) { create(:user, :admin, high_school: nil) }
        let!(:course_a) { create(:course) }
        let!(:course_b) { create(:course) }
        let!(:unit_a) { create(:unit, course: course_a) }
        let!(:unit_b) { create(:unit, course: course_b) }
        let!(:history_a) { create(:import_history, unit: unit_a) }
        let!(:history_b) { create(:import_history, unit: unit_b) }
        let(:cookie) { login_and_get_cookie(admin_user) }

        it '指定 course に属する履歴のみ返す' do
          subject
          ids = response.parsed_body['import_histories'].pluck('id')
          expect(ids).to contain_exactly(history_a.id)
        end
      end

      context 'unit_id パラメータ指定時' do
        subject do
          get '/api/v1/admin/import_histories', params: { unit_id: unit_a.id },
                                                headers: headers.merge('Cookie' => cookie)
        end

        let!(:admin_user) { create(:user, :admin, high_school: nil) }
        let!(:unit_a) { create(:unit) }
        let!(:unit_b) { create(:unit) }
        let!(:history_a) { create(:import_history, unit: unit_a) }
        let!(:history_b) { create(:import_history, unit: unit_b) }
        let(:cookie) { login_and_get_cookie(admin_user) }

        it '指定 unit の履歴のみ返す' do
          subject
          ids = response.parsed_body['import_histories'].pluck('id')
          expect(ids).to contain_exactly(history_a.id)
        end
      end

      context 'user_id パラメータ指定時' do
        subject do
          get '/api/v1/admin/import_histories', params: { user_id: executor_a.id },
                                                headers: headers.merge('Cookie' => cookie)
        end

        let!(:admin_user) { create(:user, :admin, high_school: nil) }
        let!(:executor_a) { create(:user, :admin, high_school: nil) }
        let!(:executor_b) { create(:user, :admin, high_school: nil) }
        let!(:history_a) { create(:import_history, user: executor_a) }
        let!(:history_b) { create(:import_history, user: executor_b) }
        let(:cookie) { login_and_get_cookie(admin_user) }

        it '指定 user (実行者) の履歴のみ返す' do
          subject
          ids = response.parsed_body['import_histories'].pluck('id')
          expect(ids).to contain_exactly(history_a.id)
        end
      end

      context 'from/to パラメータ指定時' do
        subject do
          get '/api/v1/admin/import_histories', params: { from: 6.days.ago.to_date.to_s, to: 2.days.ago.to_date.to_s },
                                                headers: headers.merge('Cookie' => cookie)
        end

        let!(:admin_user) { create(:user, :admin, high_school: nil) }
        let!(:old) { create(:import_history, created_at: 10.days.ago) }
        let!(:mid) { create(:import_history, created_at: 5.days.ago) }
        let!(:recent) { create(:import_history, created_at: 1.day.ago) }
        let(:cookie) { login_and_get_cookie(admin_user) }

        it '期間内の履歴のみ返す' do
          subject
          ids = response.parsed_body['import_histories'].pluck('id')
          expect(ids).to contain_exactly(mid.id)
        end
      end
    end

    context '異常系' do
      context '未認証アクセス' do
        it '401が返される' do
          get '/api/v1/admin/import_histories', headers: headers
          expect(response).to have_http_status(:unauthorized)
        end
      end

      context '管理者以外のアクセス（生徒）' do
        let!(:student_user) { create(:user) }

        it '403が返される' do
          cookie = login_and_get_cookie(student_user)
          get '/api/v1/admin/import_histories', headers: headers.merge('Cookie' => cookie)
          expect(response).to have_http_status(:forbidden)
        end
      end

      context '管理者以外のアクセス（教員）' do
        let!(:teacher_user) { create(:user, :teacher) }

        it '403が返される' do
          cookie = login_and_get_cookie(teacher_user)
          get '/api/v1/admin/import_histories', headers: headers.merge('Cookie' => cookie)
          expect(response).to have_http_status(:forbidden)
        end
      end
    end
  end
end
