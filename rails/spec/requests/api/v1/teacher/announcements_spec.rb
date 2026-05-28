# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Teacher::Announcements', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: {
           email: user.email,
           password: 'password'
         }.to_json,
         headers: headers

    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/teacher/announcements' do
    context '正常系' do
      let!(:high_school) { create(:high_school) }

      let!(:teacher) { create(:user, :teacher, high_school: high_school) }
      let(:cookie) { login_and_get_cookie(teacher) }

      let!(:other_teacher) { create(:user, :teacher) }
      let!(:student) { create(:user, :student, high_school: high_school) }

      # teacher が閲覧できるお知らせ
      let!(:announcements) do
        create_list(:announcement, 3, :published, publisher: teacher).map do |a|
          create(:announcement_target, :all_users, announcement: a)
          a
        end
      end

      # 下書き
      let!(:draft_announcements) do
        create_list(:announcement, 3, :draft, publisher: teacher).map do |a|
          create(:announcement_target, :all_users, announcement: a)
          a
        end
      end

      # 生徒向け
      let!(:student_announcements) do
        create_list(:announcement, 2, :published, publisher: teacher).map do |a|
          create(
            :announcement_target,
            :by_role,
            announcement: a,
            user_role_id: student.user_role_id
          )
          a
        end
      end

      # 別高校向け
      let!(:other_school_announcements) do
        other_school = create(:high_school)

        create_list(:announcement, 2, :published, publisher: other_teacher).map do |a|
          create(
            :announcement_target,
            :by_school,
            announcement: a,
            high_school_id: other_school.id
          )
          a
        end
      end

      # 特定ユーザー向け
      let!(:other_user_announcements) do
        create_list(:announcement, 2, :published, publisher: other_teacher).map do |a|
          create(
            :announcement_target,
            :by_user,
            announcement: a,
            user_id: other_teacher.id
          )
          a
        end
      end

      it '200が返る' do
        get '/api/v1/teacher/announcements',
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it '最大20件取得できる' do
        get '/api/v1/teacher/announcements',
            headers: headers.merge('Cookie' => cookie)

        expect(response.parsed_body.size).to eq(3)
      end

      it 'for_userの対象データが返る' do
        get '/api/v1/teacher/announcements',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        returned_ids = json.pluck('id')

        expect(returned_ids).to match_array(announcements.map(&:id))
      end

      it 'draftは返らない' do
        get '/api/v1/teacher/announcements',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        returned_ids = json.pluck('id')

        expect(returned_ids).not_to include(*draft_announcements.map(&:id))
      end

      it '生徒向けのお知らせは返らない' do
        get '/api/v1/teacher/announcements',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        returned_ids = json.pluck('id')

        expect(returned_ids).not_to include(*student_announcements.map(&:id))
      end

      it '別高校向けのお知らせは返らない' do
        get '/api/v1/teacher/announcements',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        returned_ids = json.pluck('id')

        expect(returned_ids).not_to include(*other_school_announcements.map(&:id))
      end

      it '別ユーザー向けのお知らせは返らない' do
        get '/api/v1/teacher/announcements',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        returned_ids = json.pluck('id')

        expect(returned_ids).not_to include(*other_user_announcements.map(&:id))
      end
    end

    context '異常系 - 未認証' do
      it '401が返る' do
        get '/api/v1/teacher/announcements',
            headers: headers

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - teacher以外' do
      let!(:student) { create(:user) }
      let(:cookie) { login_and_get_cookie(student) }

      it '403が返る' do
        get '/api/v1/teacher/announcements',
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
