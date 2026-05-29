# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Admins', type: :request do
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

  describe 'ルーティング・認可' do
    let!(:admin_user)   { create(:user, :admin, high_school: nil) }
    let!(:student_user) { create(:user) }
    let(:admin_cookie)   { login_and_get_cookie(admin_user) }
    let(:student_cookie) { login_and_get_cookie(student_user) }

    shared_examples '未認証は401' do |verb, path_proc, body: nil|
      it '401が返される' do
        send(verb, instance_exec(&path_proc), params: body, headers: headers)
        expect(response).to have_http_status(:unauthorized)
      end
    end

    shared_examples '非adminロールは403' do |verb, path_proc, body: nil|
      it '403が返される' do
        send(verb, instance_exec(&path_proc),
             params: body,
             headers: headers.merge('Cookie' => student_cookie))
        expect(response).to have_http_status(:forbidden)
      end
    end

    describe 'GET /api/v1/admin/admins' do
      include_examples '未認証は401', :get, -> { '/api/v1/admin/admins' }
      include_examples '非adminロールは403', :get, -> { '/api/v1/admin/admins' }
    end

    describe 'GET /api/v1/admin/admins/:id' do
      include_examples '未認証は401', :get, -> { "/api/v1/admin/admins/#{admin_user.id}" }
      include_examples '非adminロールは403', :get, -> { "/api/v1/admin/admins/#{admin_user.id}" }
    end

    describe 'POST /api/v1/admin/admins' do
      let(:body) { { name: 'x', email: 'x@example.com' }.to_json }
      include_examples '未認証は401', :post, -> { '/api/v1/admin/admins' }, body: lambda { { name: 'x', email: 'x@example.com' }.to_json }.call
      include_examples '非adminロールは403', :post, -> { '/api/v1/admin/admins' }, body: lambda { { name: 'x', email: 'x@example.com' }.to_json }.call
    end

    describe 'PATCH /api/v1/admin/admins/:id' do
      include_examples '未認証は401', :patch, -> { "/api/v1/admin/admins/#{admin_user.id}" }, body: lambda { { name: 'x' }.to_json }.call
      include_examples '非adminロールは403', :patch, -> { "/api/v1/admin/admins/#{admin_user.id}" }, body: lambda { { name: 'x' }.to_json }.call
    end

    describe 'DELETE /api/v1/admin/admins/:id' do
      include_examples '未認証は401', :delete, -> { "/api/v1/admin/admins/#{admin_user.id}" }
      include_examples '非adminロールは403', :delete, -> { "/api/v1/admin/admins/#{admin_user.id}" }
    end
  end

  describe 'GET /api/v1/admin/admins' do
    let!(:admin_user) { create(:user, :admin, high_school: nil, name: 'メイン管理者', email: 'main-admin@example.com') }
    let(:cookie)      { login_and_get_cookie(admin_user) }

    context '正常系' do
      let!(:another_admin) do
        create(:user, :admin, high_school: nil, name: '田中管理者', email: 'tanaka-admin@example.com')
      end
      let!(:deleted_admin) do
        create(:user, :admin, high_school: nil, name: '削除済', email: 'deleted-admin@example.com',
                              deleted_at: Time.current)
      end
      let!(:teacher_user) { create(:user, :teacher, high_school: create(:high_school), grade: nil) }

      it 'ステータス200が返される' do
        get '/api/v1/admin/admins', headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:ok)
      end

      it 'admins と meta キーが含まれる' do
        get '/api/v1/admin/admins', headers: headers.merge('Cookie' => cookie)
        expect(response.parsed_body.keys).to include('admins', 'meta')
      end

      it 'adminロールかつ deleted_at が nil のユーザーだけが返される' do
        get '/api/v1/admin/admins', headers: headers.merge('Cookie' => cookie)
        ids = response.parsed_body['admins'].pluck('id')
        expect(ids).to contain_exactly(admin_user.id, another_admin.id)
      end

      it '各 admin に必要なフィールドが含まれる' do
        get '/api/v1/admin/admins', headers: headers.merge('Cookie' => cookie)
        admin_data = response.parsed_body['admins'].first
        expect(admin_data.keys).to include('id', 'name', 'email', 'created_at')
      end

      it 'meta に page/per_page/total_pages/total_count が含まれる' do
        get '/api/v1/admin/admins', headers: headers.merge('Cookie' => cookie)
        meta = response.parsed_body['meta']
        expect(meta.keys).to include('page', 'per_page', 'total_pages', 'total_count')
        expect(meta['total_count']).to eq(2)
      end

      it 'q で name の部分一致絞り込みができる' do
        get '/api/v1/admin/admins',
            params: { q: '田中' },
            headers: headers.merge('Cookie' => cookie)
        ids = response.parsed_body['admins'].pluck('id')
        expect(ids).to contain_exactly(another_admin.id)
      end

      it 'q で email の部分一致絞り込みができる' do
        get '/api/v1/admin/admins',
            params: { q: 'tanaka-admin' },
            headers: headers.merge('Cookie' => cookie)
        ids = response.parsed_body['admins'].pluck('id')
        expect(ids).to contain_exactly(another_admin.id)
      end

      it 'per_page で件数を制限できる' do
        get '/api/v1/admin/admins',
            params: { per_page: 1, page: 1 },
            headers: headers.merge('Cookie' => cookie)
        expect(response.parsed_body['admins'].size).to eq(1)
        expect(response.parsed_body['meta']['total_pages']).to eq(2)
      end
    end
  end

  describe 'GET /api/v1/admin/admins/:id' do
    let!(:admin_user) { create(:user, :admin, high_school: nil) }
    let(:cookie)      { login_and_get_cookie(admin_user) }

    context '正常系' do
      let!(:target) do
        create(:user, :admin, high_school: nil, name: '対象管理者', email: 'target-admin@example.com')
      end

      it 'ステータス200が返される' do
        get "/api/v1/admin/admins/#{target.id}", headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:ok)
      end

      it '詳細レスポンスに id/name/email/created_at/updated_at/activity_log を含む' do
        get "/api/v1/admin/admins/#{target.id}", headers: headers.merge('Cookie' => cookie)
        admin_data = response.parsed_body['admin']
        expect(admin_data.keys).to include('id', 'name', 'email', 'created_at', 'updated_at', 'activity_log')
      end

      it 'activity_log は空配列で返される' do
        get "/api/v1/admin/admins/#{target.id}", headers: headers.merge('Cookie' => cookie)
        expect(response.parsed_body['admin']['activity_log']).to eq([])
      end
    end

    context '異常系' do
      it '存在しないidの場合404が返される' do
        get '/api/v1/admin/admins/0', headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:not_found)
      end

      it 'admin以外のロールのユーザーidの場合404が返される' do
        teacher = create(:user, :teacher, high_school: create(:high_school), grade: nil)
        get "/api/v1/admin/admins/#{teacher.id}", headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:not_found)
      end

      it '論理削除済みadminのidの場合404が返される' do
        deleted = create(:user, :admin, high_school: nil, deleted_at: Time.current)
        get "/api/v1/admin/admins/#{deleted.id}", headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
