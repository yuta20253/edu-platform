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
end
