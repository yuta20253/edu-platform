# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Announcements', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end

  let!(:admin_user) { create(:user, :admin, high_school: nil) }
  let(:cookie) { login_and_get_cookie(admin_user) }
  let(:auth_headers) { headers.merge('Cookie' => cookie) }

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: { email: user.email, password: 'password' }.to_json,
         headers: headers
    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/admin/announcements' do
    subject { get '/api/v1/admin/announcements', headers: auth_headers }

    let!(:admin_announcement) do
      ann = create(:announcement, publisher: admin_user, title: 'システムメンテナンスのお知らせ')
      create(:announcement_target, :all_users, announcement: ann)
      ann
    end

    let!(:teacher_announcement) do
      teacher = create(:user, :teacher)
      ann = create(:announcement, publisher: teacher, title: '教師からのお知らせ')
      create(:announcement_target, :by_school, announcement: ann, high_school_id: teacher.high_school_id)
      ann
    end

    context '正常系' do
      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it 'announcements キーとmetaが含まれる' do
        subject
        expect(response.parsed_body).to have_key('announcements')
        expect(response.parsed_body['meta']).to include('current_page' => 1, 'per_page' => 20)
      end

      it '管理者が作成したお知らせのみ含まれる' do
        subject
        ids = response.parsed_body['announcements'].pluck('id')
        expect(ids).to contain_exactly(admin_announcement.id)
      end

      it '一覧の各要素にcontentを含まない' do
        subject
        expect(response.parsed_body['announcements'].first.keys).not_to include('content')
      end

      context 'statusで絞り込む場合' do
        let!(:published_announcement) do
          ann = create(:announcement, publisher: admin_user, status: :published)
          create(:announcement_target, :all_users, announcement: ann)
          ann
        end

        it '指定したstatusのみ返す' do
          get '/api/v1/admin/announcements', params: { status: 'published' }, headers: auth_headers
          ids = response.parsed_body['announcements'].pluck('id')
          expect(ids).to contain_exactly(published_announcement.id)
        end
      end

      context 'qで検索する場合' do
        it 'タイトルが部分一致するもののみ返す' do
          get '/api/v1/admin/announcements', params: { q: 'メンテナンス' }, headers: auth_headers
          ids = response.parsed_body['announcements'].pluck('id')
          expect(ids).to contain_exactly(admin_announcement.id)
        end
      end

      context 'qに配列を指定する場合' do
        it 'エラーにならずステータス200が返される' do
          get '/api/v1/admin/announcements', params: { q: %w[foo bar] }, headers: auth_headers
          expect(response).to have_http_status(:ok)
        end
      end
    end

    context '異常系 - 未認証アクセス' do
      it '401が返される' do
        get '/api/v1/admin/announcements', headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 管理者以外のアクセス（生徒）' do
      it '403が返される' do
        student = create(:user)
        cookie = login_and_get_cookie(student)
        get '/api/v1/admin/announcements', headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'GET /api/v1/admin/announcements/:id' do
    let!(:announcement) do
      ann = create(:announcement, publisher: admin_user, content: '詳細本文です。')
      create(:announcement_target, :all_users, announcement: ann)
      ann
    end

    context '正常系' do
      it 'ステータス200でcontentを含む詳細が返される' do
        get "/api/v1/admin/announcements/#{announcement.id}", headers: auth_headers
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body['announcement']['content']).to eq('詳細本文です。')
      end
    end

    context '異常系 - 教師が作成したお知らせを指定した場合' do
      it '404が返される' do
        teacher = create(:user, :teacher)
        other = create(:announcement, publisher: teacher)
        create(:announcement_target, :by_school, announcement: other, high_school_id: teacher.high_school_id)

        get "/api/v1/admin/announcements/#{other.id}", headers: auth_headers
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'POST /api/v1/admin/announcements' do
    let(:valid_params) do
      {
        announcement: {
          title: 'システムメンテナンスのお知らせ',
          content: 'メンテナンスを実施します。',
          status: 'draft'
        }
      }
    end

    context '正常系' do
      it 'ステータス201が返される' do
        post '/api/v1/admin/announcements', params: valid_params.to_json, headers: auth_headers
        expect(response).to have_http_status(:created)
      end

      it 'announcementが作成される' do
        expect do
          post '/api/v1/admin/announcements', params: valid_params.to_json, headers: auth_headers
        end.to change(Announcement, :count).by(1)
      end

      it 'publisherが現在の管理者になる' do
        post '/api/v1/admin/announcements', params: valid_params.to_json, headers: auth_headers
        expect(Announcement.last.publisher).to eq(admin_user)
      end

      it 'all_usersターゲットが1件作成される' do
        post '/api/v1/admin/announcements', params: valid_params.to_json, headers: auth_headers
        targets = Announcement.last.announcement_targets
        expect(targets.count).to eq(1)
        expect(targets.first.target_type).to eq('all_users')
      end
    end

    context '異常系 - titleが空の場合' do
      it 'ステータス422が返される' do
        params = valid_params.deep_merge(announcement: { title: '' })
        post '/api/v1/admin/announcements', params: params.to_json, headers: auth_headers
        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '異常系 - statusが不正な場合' do
      it 'ステータス422が返される' do
        params = valid_params.deep_merge(announcement: { status: 'invalid' })
        post '/api/v1/admin/announcements', params: params.to_json, headers: auth_headers
        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '異常系 - 未認証アクセス' do
      it '401が返される' do
        post '/api/v1/admin/announcements', params: valid_params.to_json, headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'PATCH /api/v1/admin/announcements/:id' do
    context 'draftのお知らせの場合' do
      let!(:announcement) { create(:announcement, publisher: admin_user, title: '旧タイトル') }

      it 'ステータス200が返される' do
        patch "/api/v1/admin/announcements/#{announcement.id}",
              params: { announcement: { title: '新タイトル' } }.to_json, headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it 'titleが更新される' do
        patch "/api/v1/admin/announcements/#{announcement.id}",
              params: { announcement: { title: '新タイトル' } }.to_json, headers: auth_headers
        expect(announcement.reload.title).to eq('新タイトル')
      end
    end

    context 'publishedのお知らせの場合' do
      let!(:announcement) { create(:announcement, publisher: admin_user, title: '旧タイトル', status: :published) }

      it 'ステータス403が返される' do
        patch "/api/v1/admin/announcements/#{announcement.id}",
              params: { announcement: { title: '新タイトル' } }.to_json, headers: auth_headers
        expect(response).to have_http_status(:forbidden)
      end

      it 'titleが更新されない' do
        patch "/api/v1/admin/announcements/#{announcement.id}",
              params: { announcement: { title: '新タイトル' } }.to_json, headers: auth_headers
        expect(announcement.reload.title).to eq('旧タイトル')
      end
    end

    context '異常系 - 教師が作成したお知らせを指定した場合' do
      it '404が返される' do
        teacher = create(:user, :teacher)
        other = create(:announcement, publisher: teacher)
        create(:announcement_target, :by_school, announcement: other, high_school_id: teacher.high_school_id)

        patch "/api/v1/admin/announcements/#{other.id}",
              params: { announcement: { title: '新タイトル' } }.to_json, headers: auth_headers
        expect(response).to have_http_status(:not_found)
      end
    end

    context '異常系 - 他の管理者が作成したdraftのお知らせを指定した場合' do
      let!(:other_admin_announcement) do
        other_admin = create(:user, :admin, high_school: nil)
        create(:announcement, publisher: other_admin, title: '他の管理者のお知らせ')
      end

      it 'ステータス403が返される' do
        patch "/api/v1/admin/announcements/#{other_admin_announcement.id}",
              params: { announcement: { title: '新タイトル' } }.to_json, headers: auth_headers
        expect(response).to have_http_status(:forbidden)
      end

      it 'titleが更新されない' do
        patch "/api/v1/admin/announcements/#{other_admin_announcement.id}",
              params: { announcement: { title: '新タイトル' } }.to_json, headers: auth_headers
        expect(other_admin_announcement.reload.title).to eq('他の管理者のお知らせ')
      end
    end
  end

  describe 'DELETE /api/v1/admin/announcements/:id' do
    context 'draftのお知らせの場合' do
      let!(:announcement) { create(:announcement, publisher: admin_user) }

      it 'ステータス204が返される' do
        delete "/api/v1/admin/announcements/#{announcement.id}", headers: auth_headers
        expect(response).to have_http_status(:no_content)
      end

      it 'announcementが削除される' do
        expect do
          delete "/api/v1/admin/announcements/#{announcement.id}", headers: auth_headers
        end.to change(Announcement, :count).by(-1)
      end
    end

    context 'publishedのお知らせの場合' do
      let!(:announcement) { create(:announcement, publisher: admin_user, status: :published) }

      it 'ステータス403が返される' do
        delete "/api/v1/admin/announcements/#{announcement.id}", headers: auth_headers
        expect(response).to have_http_status(:forbidden)
      end

      it 'announcementが削除されない' do
        expect do
          delete "/api/v1/admin/announcements/#{announcement.id}", headers: auth_headers
        end.not_to change(Announcement, :count)
      end
    end

    context '異常系 - 他の管理者が作成したdraftのお知らせの場合' do
      let!(:other_admin_announcement) do
        other_admin = create(:user, :admin, high_school: nil)
        create(:announcement, publisher: other_admin)
      end

      it 'ステータス403が返される' do
        delete "/api/v1/admin/announcements/#{other_admin_announcement.id}", headers: auth_headers
        expect(response).to have_http_status(:forbidden)
      end

      it 'announcementが削除されない' do
        expect do
          delete "/api/v1/admin/announcements/#{other_admin_announcement.id}", headers: auth_headers
        end.not_to change(Announcement, :count)
      end
    end
  end

  describe 'POST /api/v1/admin/announcements/:id/publish' do
    context 'draftのお知らせの場合' do
      let!(:announcement) { create(:announcement, publisher: admin_user) }

      before do
        create(:announcement_target, :all_users, announcement: announcement)
      end

      it 'ステータス200が返される' do
        post "/api/v1/admin/announcements/#{announcement.id}/publish", headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it 'publishedになる' do
        post "/api/v1/admin/announcements/#{announcement.id}/publish", headers: auth_headers
        expect(announcement.reload.status).to eq('published')
      end

      it '生徒から見えるようになる' do
        student = create(:user)
        post "/api/v1/admin/announcements/#{announcement.id}/publish", headers: auth_headers
        expect(Announcement.for_user(student).published).to include(announcement)
      end
    end

    context 'すでにpublishedのお知らせの場合' do
      let!(:announcement) { create(:announcement, publisher: admin_user, status: :published) }

      it 'ステータス403が返される' do
        post "/api/v1/admin/announcements/#{announcement.id}/publish", headers: auth_headers
        expect(response).to have_http_status(:forbidden)
      end
    end

    context '異常系 - 他の管理者が作成したdraftのお知らせの場合' do
      let!(:other_admin_announcement) do
        other_admin = create(:user, :admin, high_school: nil)
        ann = create(:announcement, publisher: other_admin)
        create(:announcement_target, :all_users, announcement: ann)
        ann
      end

      it 'ステータス403が返される' do
        post "/api/v1/admin/announcements/#{other_admin_announcement.id}/publish", headers: auth_headers
        expect(response).to have_http_status(:forbidden)
      end

      it 'publishedにならない' do
        post "/api/v1/admin/announcements/#{other_admin_announcement.id}/publish", headers: auth_headers
        expect(other_admin_announcement.reload.status).to eq('draft')
      end
    end
  end
end
