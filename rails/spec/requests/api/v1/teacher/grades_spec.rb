# spec/requests/api/v1/teacher/grades_spec.rb

require 'rails_helper'

RSpec.describe "Api::V1::Teacher::Grades", type: :request do
  describe "GET /api/v1/teacher/grades" do
    let(:teacher) { create(:user, :teacher, high_school: high_school) }
    let(:high_school) { create(:high_school) }
    let(:other_high_school) { create(:high_school) }

    let!(:grade) do
      create(
        :grade,
        high_school: high_school,
        year: 1
      )
    end

    let!(:other_grade) do
      create(
        :grade,
        high_school: other_high_school,
        year: 2
      )
    end

    before do
      login_as(teacher)
    end

    it "ログインユーザーの高校の学年一覧を返す" do
      get "/api/v1/teacher/grades"

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)

      expect(json.size).to eq(1)
      expect(json.first["id"]).to eq(grade.id)
      expect(json.first["id"]).not_to eq(other_grade.id)
    end
  end
end
