# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Courses', type: :request do
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

  describe 'GET /api/v1/admin/courses/:id' do
    context '正常系' do
      subject { get "/api/v1/admin/courses/#{course.id}", headers: headers.merge('Cookie' => cookie) }

      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let!(:subject_record) { create(:subject, name: '数学') }
      let!(:course) do
        create(:course,
               subject: subject_record,
               level_number: 2,
               level_name: '標準',
               description: '標準レベルのコース')
      end
      let!(:units) { create_list(:unit, 2, course: course) }

      let(:cookie) { login_and_get_cookie(admin_user) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it '講座の基本フィールドが含まれる' do
        subject
        body = response.parsed_body
        expect(body.keys).to include('id', 'subject', 'level_number', 'level_name', 'description', 'units')
      end

      it 'id / level_number / level_name / description が正しい' do
        subject
        body = response.parsed_body
        expect(body['id']).to eq(course.id)
        expect(body['level_number']).to eq(2)
        expect(body['level_name']).to eq('標準')
        expect(body['description']).to eq('標準レベルのコース')
      end

      it 'subject は id と name を含む' do
        subject
        body = response.parsed_body
        expect(body['subject']).to eq('id' => subject_record.id, 'name' => '数学')
      end

      it 'units 配列に course に紐づく全 unit が id 昇順で含まれる' do
        subject
        body = response.parsed_body
        unit_ids = body['units'].pluck('id')
        expect(unit_ids).to eq(units.map(&:id).sort)
      end

      it '各 unit に id / unit_name が含まれる' do
        subject
        body = response.parsed_body
        unit_data = body['units'].first
        expect(unit_data.keys).to include('id', 'unit_name')
      end
    end
  end
end
