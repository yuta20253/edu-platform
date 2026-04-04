# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Teacher::Dashboards', type: :request do
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

  describe 'GET /api/v1/teacher/dashboard' do
    context '正常系' do
      subject { get '/api/v1/teacher/dashboard', headers: headers.merge('Cookie' => cookie) }

      let!(:high_school) { create(:high_school) }

      let!(:grade_one) { create(:grade, year: 1) }
      let!(:grade_two) { create(:grade, year: 2) }
      let!(:grade_three) { create(:grade, year: 3) }

      let!(:login_teacher) { create(:user, :teacher, high_school: high_school) }

      let!(:grade_one_students_count) do
        create_list(:user, 5, high_school: high_school, grade: grade_one)
      end

      let!(:grade_two_students_count) do
        create_list(:user, 10, high_school: high_school, grade: grade_two)
      end

      let!(:grade_three_students_count) do
        create_list(:user, 100, high_school: high_school, grade: grade_three)
      end

      let!(:announcements) do
        create_list(:announcement, 6, :published, published_at: Time.current, publisher: login_teacher).each do |a|
          create(:announcement_target, announcement: a, target_type: :all_users)
        end
      end

      let!(:draft_announcements) do
        create_list(:announcement, 6, :draft, published_at: Time.current, publisher: login_teacher).each do |a|
          create(:announcement_target, announcement: a, target_type: :all_users)
        end
      end

      let(:cookie) { login_and_get_cookie(login_teacher) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it 'stats.grade_one_students_countが5件返される' do
        subject
        expect(response.parsed_body.dig('stats', 'grade_one_students_count')).to eq(5)
      end

      it 'stats.grade_two_students_countが10件返される' do
        subject
        expect(response.parsed_body.dig('stats', 'grade_two_students_count')).to eq(10)
      end

      it 'stats.grade_three_students_countが100件返される' do
        subject
        expect(response.parsed_body.dig('stats', 'grade_three_students_count')).to eq(100)
      end

      it 'announcementsが最大5件返される' do
        subject
        expect(response.parsed_body['announcements'].size).to eq(5)
      end

      it 'publishedのannouncementsだけが返される' do
        subject

        ids = response.parsed_body['announcements'].pluck('id')

        expect(ids).to all(be_in(announcements.map(&:id)))
        expect(ids).not_to include(*draft_announcements.map(&:id))
      end
    end

    context '異常系 - 未認証アクセス' do
      it '401が返される' do
        get '/api/v1/teacher/dashboard', headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 教師以外のアクセス（生徒）' do
      let!(:student_user) { create(:user) }

      it '403が返される' do
        cookie = login_and_get_cookie(student_user)
        get '/api/v1/teacher/dashboard', headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
