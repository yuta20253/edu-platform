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

  describe '認可' do
    let!(:admin_user)   { create(:user, :admin, high_school: nil) }
    let!(:student_user) { create(:user) }
    let(:student_cookie) { login_and_get_cookie(student_user) }
    let(:create_body) { { name: 'x', email: 'x@example.com' }.to_json }
    let(:update_body) { { name: 'x' }.to_json }

    context '未認証アクセス' do
      it 'GET /admins は401' do
        get '/api/v1/admin/admins', headers: headers
        expect(response).to have_http_status(:unauthorized)
      end

      it 'GET /admins/:id は401' do
        get "/api/v1/admin/admins/#{admin_user.id}", headers: headers
        expect(response).to have_http_status(:unauthorized)
      end

      it 'POST /admins は401' do
        post '/api/v1/admin/admins', params: create_body, headers: headers
        expect(response).to have_http_status(:unauthorized)
      end

      it 'PATCH /admins/:id は401' do
        patch "/api/v1/admin/admins/#{admin_user.id}", params: update_body, headers: headers
        expect(response).to have_http_status(:unauthorized)
      end

      it 'DELETE /admins/:id は401' do
        delete "/api/v1/admin/admins/#{admin_user.id}", headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '非adminロール (student) アクセス' do
      it 'GET /admins は403' do
        get '/api/v1/admin/admins', headers: headers.merge('Cookie' => student_cookie)
        expect(response).to have_http_status(:forbidden)
      end

      it 'GET /admins/:id は403' do
        get "/api/v1/admin/admins/#{admin_user.id}", headers: headers.merge('Cookie' => student_cookie)
        expect(response).to have_http_status(:forbidden)
      end

      it 'POST /admins は403' do
        post '/api/v1/admin/admins', params: create_body, headers: headers.merge('Cookie' => student_cookie)
        expect(response).to have_http_status(:forbidden)
      end

      it 'PATCH /admins/:id は403' do
        patch "/api/v1/admin/admins/#{admin_user.id}",
              params: update_body, headers: headers.merge('Cookie' => student_cookie)
        expect(response).to have_http_status(:forbidden)
      end

      it 'DELETE /admins/:id は403' do
        delete "/api/v1/admin/admins/#{admin_user.id}", headers: headers.merge('Cookie' => student_cookie)
        expect(response).to have_http_status(:forbidden)
      end
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

      it 'meta に current_page/per_page/total_pages/total_count が含まれる' do
        get '/api/v1/admin/admins', headers: headers.merge('Cookie' => cookie)
        meta = response.parsed_body['meta']
        expect(meta.keys).to include('current_page', 'per_page', 'total_pages', 'total_count')
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

  describe 'POST /api/v1/admin/admins' do
    let!(:admin_user) { create(:user, :admin, high_school: nil) }
    let(:cookie)      { login_and_get_cookie(admin_user) }
    let(:valid_params) do
      { name: '新規管理者', email: 'new-admin@example.com' }.to_json
    end

    context '正常系' do
      it 'ステータス201が返される' do
        post '/api/v1/admin/admins',
             params: valid_params,
             headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:created)
      end

      it '作成された admin が返される' do
        post '/api/v1/admin/admins',
             params: valid_params,
             headers: headers.merge('Cookie' => cookie)
        admin_data = response.parsed_body['admin']
        expect(admin_data['name']).to eq('新規管理者')
        expect(admin_data['email']).to eq('new-admin@example.com')
      end

      it 'admin ロールの User が新規作成され password_reset_required: true となる' do
        expect do
          post '/api/v1/admin/admins',
               params: valid_params,
               headers: headers.merge('Cookie' => cookie)
        end.to change { User.admins.count }.by(1)

        created = User.admins.find_by(email: 'new-admin@example.com')
        expect(created.password_reset_required).to be(true)
      end
    end

    context '異常系' do
      it 'email が空の場合 422 が返される' do
        post '/api/v1/admin/admins',
             params: { name: '名前のみ', email: '' }.to_json,
             headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body).to have_key('errors')
      end

      it 'email が重複している場合 422 が返される' do
        create(:user, :admin, high_school: nil, email: 'dup-admin@example.com')
        post '/api/v1/admin/admins',
             params: { name: '重複', email: 'dup-admin@example.com' }.to_json,
             headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:unprocessable_content)
      end
    end
  end

  describe 'PATCH /api/v1/admin/admins/:id' do
    let!(:admin_user) { create(:user, :admin, high_school: nil) }
    let!(:target) do
      create(:user, :admin, high_school: nil, name: '更新前太郎', email: 'before-admin@example.com')
    end
    let(:cookie) { login_and_get_cookie(admin_user) }
    let(:valid_params) do
      { name: '更新後太郎', email: 'after-admin@example.com' }.to_json
    end

    context '正常系' do
      it 'ステータス200が返される' do
        patch "/api/v1/admin/admins/#{target.id}",
              params: valid_params,
              headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:ok)
      end

      it 'name / email が更新される' do
        patch "/api/v1/admin/admins/#{target.id}",
              params: valid_params,
              headers: headers.merge('Cookie' => cookie)
        admin_data = response.parsed_body['admin']
        expect(admin_data['name']).to eq('更新後太郎')
        expect(admin_data['email']).to eq('after-admin@example.com')
      end

      it 'DBに永続化される' do
        patch "/api/v1/admin/admins/#{target.id}",
              params: valid_params,
              headers: headers.merge('Cookie' => cookie)
        target.reload
        expect(target.name).to eq('更新後太郎')
        expect(target.email).to eq('after-admin@example.com')
      end
    end

    context '異常系' do
      it '存在しないidの場合 404 が返される' do
        patch '/api/v1/admin/admins/0',
              params: valid_params,
              headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:not_found)
      end

      it 'email 重複の場合 422 が返される' do
        create(:user, :admin, high_school: nil, email: 'taken@example.com')
        patch "/api/v1/admin/admins/#{target.id}",
              params: { email: 'taken@example.com' }.to_json,
              headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:unprocessable_content)
      end
    end
  end

  describe 'DELETE /api/v1/admin/admins/:id' do
    let!(:admin_user) { create(:user, :admin, high_school: nil) }
    let(:cookie)      { login_and_get_cookie(admin_user) }

    context '正常系' do
      let!(:target) { create(:user, :admin, high_school: nil) }

      it 'ステータス204が返される' do
        delete "/api/v1/admin/admins/#{target.id}", headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:no_content)
      end

      it '対象adminに deleted_at がセットされる' do
        delete "/api/v1/admin/admins/#{target.id}", headers: headers.merge('Cookie' => cookie)
        target.reload
        expect(target.deleted_at).to be_present
      end

      it '一覧から消える' do
        delete "/api/v1/admin/admins/#{target.id}", headers: headers.merge('Cookie' => cookie)
        get '/api/v1/admin/admins', headers: headers.merge('Cookie' => cookie)
        ids = response.parsed_body['admins'].pluck('id')
        expect(ids).not_to include(target.id)
      end
    end

    context '異常系' do
      it '存在しないidの場合 404 が返される' do
        delete '/api/v1/admin/admins/0', headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:not_found)
      end
    end

    context 'ガード - 自分自身は削除不可' do
      # 他にも admin がいる状態で自分を消そうとするケース → 自己削除ガード
      let!(:another_admin) { create(:user, :admin, high_school: nil) }

      it '422が返される' do
        delete "/api/v1/admin/admins/#{admin_user.id}", headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:unprocessable_content)
      end

      it 'errors に「自分自身」を含むメッセージが返される' do
        delete "/api/v1/admin/admins/#{admin_user.id}", headers: headers.merge('Cookie' => cookie)
        expect(response.parsed_body['errors']).to include(a_string_matching(/自分自身/))
      end

      it 'deleted_at は更新されない' do
        delete "/api/v1/admin/admins/#{admin_user.id}", headers: headers.merge('Cookie' => cookie)
        admin_user.reload
        expect(admin_user.deleted_at).to be_nil
      end
    end

    context 'ガード - 最後の admin は削除不可' do
      # 「最後の admin = 削除によってアクティブ admin が0人になる」状況は、
      # 自己削除ガードと重なるため、ガード順序を『最後のadmin → 自己削除 → 論理削除』とし
      # 「自分が唯一の admin で自分を消す」ケースで422になることを以て担保する。
      it '自分が最後の admin の状態で自分を消そうとすると 422 が返される' do
        # admin_user 以外の admin は存在しない (=admin_user が唯一のアクティブadmin)
        delete "/api/v1/admin/admins/#{admin_user.id}", headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:unprocessable_content)
      end

      it 'errors に「最後の管理者」を含むメッセージが返される' do
        delete "/api/v1/admin/admins/#{admin_user.id}", headers: headers.merge('Cookie' => cookie)
        expect(response.parsed_body['errors']).to include(a_string_matching(/最後の管理者/))
      end

      it 'deleted_at は更新されない' do
        delete "/api/v1/admin/admins/#{admin_user.id}", headers: headers.merge('Cookie' => cookie)
        admin_user.reload
        expect(admin_user.deleted_at).to be_nil
      end
    end
  end
end
