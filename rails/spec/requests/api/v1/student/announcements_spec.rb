# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Student::Announcements', type: :request do
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

  describe 'GET /api/v1/student/announcements' do
    context '正常系' do
      let!(:high_school) { create(:high_school) }

      let!(:student) { create(:user, :student, high_school: high_school) }
      let(:cookie) { login_and_get_cookie(student) }

      let!(:teacher) { create(:user, :teacher, high_school: high_school) }
      let!(:other_student) { create(:user, :student) }

      let!(:announcements) do
        create_list(:announcement, 5, :published, publisher: teacher).map do |a|
          create(:announcement_target, :all_users, announcement: a)
          a
        end
      end

      let!(:draft_announcements) do
        create_list(:announcement, 3, :draft, publisher: teacher).map do |a|
          create(:announcement_target, :all_users, announcement: a)
          a
        end
      end

      let!(:teacher_announcements) do
        create_list(:announcement, 2, :published, publisher: teacher).map do |a|
          create(
            :announcement_target,
            :by_role,
            announcement: a,
            user_role_id: teacher.user_role_id
          )
          a
        end
      end

      let!(:other_school_announcements) do
        other_school = create(:high_school)

        create_list(:announcement, 2, :published, publisher: teacher).map do |a|
          create(
            :announcement_target,
            :by_school,
            announcement: a,
            high_school_id: other_school.id
          )
          a
        end
      end

      let!(:other_user_announcements) do
        create_list(:announcement, 2, :published, publisher: teacher).map do |a|
          create(
            :announcement_target,
            :by_user,
            announcement: a,
            user_id: other_student.id
          )
          a
        end
      end

      it '200が返る' do
        get '/api/v1/student/announcements',
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it '最大20件取得できる' do
        get '/api/v1/student/announcements',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['announcements'].size).to eq(5)
      end

      it 'for_userの対象データが返る' do
        get '/api/v1/student/announcements',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        returned_ids = json['announcements'].pluck('id')

        expect(returned_ids).to match_array(announcements.map(&:id))
      end

      it 'draftは返らない' do
        get '/api/v1/student/announcements',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        returned_ids = json['announcements'].pluck('id')

        expect(returned_ids).not_to include(*draft_announcements.map(&:id))
      end

      it '教師向けのお知らせは返らない' do
        get '/api/v1/student/announcements',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        returned_ids = json['announcements'].pluck('id')

        expect(returned_ids).not_to include(*teacher_announcements.map(&:id))
      end

      it '別高校向けのお知らせは返らない' do
        get '/api/v1/student/announcements',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        returned_ids = json['announcements'].pluck('id')

        expect(returned_ids).not_to include(*other_school_announcements.map(&:id))
      end

      it '別ユーザー向けのお知らせは返らない' do
        get '/api/v1/student/announcements',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        returned_ids = json['announcements'].pluck('id')

        expect(returned_ids).not_to include(*other_user_announcements.map(&:id))
      end

      it 'meta情報が返る' do
        get '/api/v1/student/announcements',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['meta']['current_page']).to eq(1)
        expect(json['meta']['total_pages']).to eq(1)
        expect(json['meta']['total_count']).to eq(5)
        expect(json['meta']['per_page']).to eq(5)
      end
    end
  end

  describe 'GET /api/v1/student/announcements/:id' do
    context '正常系' do
      let!(:high_school) { create(:high_school) }

      let!(:student) { create(:user, :student, high_school: high_school) }
      let(:cookie) { login_and_get_cookie(student) }

      let!(:teacher) { create(:user, :teacher, high_school: high_school) }
      let!(:other_student) { create(:user, :student) }

      let!(:announcement) do
        create(:announcement, :published, publisher: teacher).tap do |a|
          create(:announcement_target, :all_users, announcement: a)
        end
      end

      it '200が返る' do
        get "/api/v1/student/announcements/#{announcement.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it '対象のお知らせが取得できる' do
        get "/api/v1/student/announcements/#{announcement.id}",
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['id']).to eq(announcement.id)
        expect(json['title']).to eq(announcement.title)
        expect(json['content']).to eq(announcement.content)
      end
    end

    context '異常系' do
      let!(:high_school) { create(:high_school) }

      let!(:student) { create(:user, :student, high_school: high_school) }
      let(:cookie) { login_and_get_cookie(student) }

      let!(:teacher) { create(:user, :teacher, high_school: high_school) }

      it '教師向けのお知らせは404になる' do
        announcement = create(:announcement, :published, publisher: teacher)

        create(
          :announcement_target,
          :by_role,
          announcement: announcement,
          user_role_id: teacher.user_role_id
        )

        get "/api/v1/student/announcements/#{announcement.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end

      it '別高校向けのお知らせは404になる' do
        other_school = create(:high_school)

        announcement = create(:announcement, :published, publisher: teacher)

        create(
          :announcement_target,
          :by_school,
          announcement: announcement,
          high_school_id: other_school.id
        )

        get "/api/v1/student/announcements/#{announcement.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end

      it '別ユーザー向けのお知らせは404になる' do
        other_student = create(:user, :student)

        announcement = create(:announcement, :published, publisher: teacher)

        create(
          :announcement_target,
          :by_user,
          announcement: announcement,
          user_id: other_student.id
        )

        get "/api/v1/student/announcements/#{announcement.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end

      it 'draftは404になる' do
        announcement = create(:announcement, :draft, publisher: teacher)

        create(
          :announcement_target,
          :all_users,
          announcement: announcement
        )

        get "/api/v1/student/announcements/#{announcement.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
