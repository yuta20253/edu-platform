# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::HighSchools', type: :request do
  describe 'GET /api/v1/high_schools' do
    let!(:high_school) { create(:high_school, name: 'テスト高校', csv_managed: true) }

    it 'ステータス200が返される' do
      get '/api/v1/high_schools', params: { prefecture_id: high_school.prefecture_id }

      expect(response).to have_http_status(:ok)
    end

    it 'csv_managed を含む学校情報が返される' do
      get '/api/v1/high_schools', params: { prefecture_id: high_school.prefecture_id }

      body = response.parsed_body
      school = body.find { |s| s['name'] == 'テスト高校' }
      expect(school['csv_managed']).to be true
    end
  end
end
