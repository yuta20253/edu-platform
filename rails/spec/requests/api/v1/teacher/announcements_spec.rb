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

      let!(:announcements) do
        create_list(:announcement, 3, :published, publisher: teacher).map do |a|
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

        json = response.parsed_body

        expect(json['announcements'].size).to eq(3)
      end

      it 'for_userの対象データが返る' do
        get '/api/v1/teacher/announcements',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        returned_ids = json['announcements'].pluck('id')

        expect(returned_ids).to match_array(announcements.map(&:id))
      end

      it 'draftは返らない' do
        get '/api/v1/teacher/announcements',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        returned_ids = json['announcements'].pluck('id')

        expect(returned_ids).not_to include(*draft_announcements.map(&:id))
      end

      it '生徒向けのお知らせは返らない' do
        get '/api/v1/teacher/announcements',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        returned_ids = json['announcements'].pluck('id')

        expect(returned_ids).not_to include(*student_announcements.map(&:id))
      end

      it '別高校向けのお知らせは返らない' do
        get '/api/v1/teacher/announcements',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        returned_ids = json['announcements'].pluck('id')

        expect(returned_ids).not_to include(*other_school_announcements.map(&:id))
      end

      it '別ユーザー向けのお知らせは返らない' do
        get '/api/v1/teacher/announcements',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        returned_ids = json['announcements'].pluck('id')

        expect(returned_ids).not_to include(*other_user_announcements.map(&:id))
      end

      it 'meta情報が返る' do
        get '/api/v1/teacher/announcements',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['meta']['current_page']).to eq(1)
        expect(json['meta']['total_pages']).to eq(1)
        expect(json['meta']['total_count']).to eq(3)
        expect(json['meta']['per_page']).to eq(20)
      end
    end
  end

  describe 'GET /api/v1/teacher/announcements/:id' do
    context '正常系' do
      let!(:high_school) { create(:high_school) }

      let!(:teacher) { create(:user, :teacher, high_school: high_school) }
      let(:cookie) { login_and_get_cookie(teacher) }

      let!(:student) { create(:user, :student, high_school: high_school) }
      let!(:other_teacher) { create(:user, :teacher) }

      let!(:announcement) do
        announcement = create(
          :announcement,
          :published,
          publisher: other_teacher
        )

        create(
          :announcement_target,
          :by_role,
          announcement: announcement,
          user_role_id: teacher.user_role_id
        )

        announcement
      end

      let!(:draft_announcement) do
        announcement = create(
          :announcement,
          :draft,
          publisher: teacher
        )

        create(
          :announcement_target,
          :all_users,
          announcement: announcement
        )

        announcement
      end

      let!(:student_announcement) do
        announcement = create(
          :announcement,
          :published,
          publisher: other_teacher
        )

        create(
          :announcement_target,
          :by_role,
          announcement: announcement,
          user_role_id: student.user_role_id
        )

        announcement
      end

      let!(:other_school_announcement) do
        other_school = create(:high_school)

        announcement = create(
          :announcement,
          :published,
          publisher: other_teacher
        )

        create(
          :announcement_target,
          :by_school,
          announcement: announcement,
          high_school_id: other_school.id
        )

        announcement
      end

      let!(:other_user_announcement) do
        announcement = create(
          :announcement,
          :published,
          publisher: other_teacher
        )

        create(
          :announcement_target,
          :by_user,
          announcement: announcement,
          user_id: other_teacher.id
        )

        announcement
      end

      it '200が返る' do
        get "/api/v1/teacher/announcements/#{announcement.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it '対象のお知らせ詳細が返る' do
        get "/api/v1/teacher/announcements/#{announcement.id}",
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['id']).to eq(announcement.id)
        expect(json['title']).to eq(announcement.title)
        expect(json['content']).to eq(announcement.content)
      end

      it 'draftのお知らせは取得できない' do
        get "/api/v1/teacher/announcements/#{draft_announcement.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end

      it '生徒向けのお知らせは取得できない' do
        get "/api/v1/teacher/announcements/#{student_announcement.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end

      it '別高校向けのお知らせは取得できない' do
        get "/api/v1/teacher/announcements/#{other_school_announcement.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end

      it '別ユーザー向けのお知らせは取得できない' do
        get "/api/v1/teacher/announcements/#{other_user_announcement.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end
    end

    context '異常系 - 未認証' do
      let!(:announcement) { create(:announcement, :published) }

      it '401が返る' do
        get "/api/v1/teacher/announcements/#{announcement.id}",
            headers: headers

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - teacher以外' do
      let!(:student) { create(:user) }
      let(:cookie) { login_and_get_cookie(student) }

      let!(:announcement) { create(:announcement, :published) }

      it '403が返る' do
        get "/api/v1/teacher/announcements/#{announcement.id}",
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'POST /api/v1/teacher/announcements' do
    let!(:high_school) { create(:high_school) }

    let!(:teacher) { create(:user, :teacher, high_school: high_school) }
    let(:cookie) { login_and_get_cookie(teacher) }

    let(:params) do
      {
        announcement: {
          title: 'テストタイトル',
          content: 'テスト内容',
          announcement_targets: [
            {
              target_type: 'by_school'
            }
          ]
        }
      }
    end

    context '正常系' do
      it '201が返る' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:created)
      end

      it 'お知らせが作成される' do
        expect do
          post '/api/v1/teacher/announcements',
               params: params.to_json,
               headers: headers.merge('Cookie' => cookie)
        end.to change(Announcement, :count).by(1)
      end

      it 'announcement_targetが作成される' do
        expect do
          post '/api/v1/teacher/announcements',
               params: params.to_json,
               headers: headers.merge('Cookie' => cookie)
        end.to change(AnnouncementTarget, :count).by(1)
      end

      it 'draftで作成される' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        announcement = Announcement.last

        expect(announcement.status).to eq('draft')
      end

      it 'publisher_idにcurrent_userが入る' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        announcement = Announcement.last

        expect(announcement.publisher_id).to eq(teacher.id)
      end

      it 'by_schoolの場合high_school_idが保存される' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        target = AnnouncementTarget.last

        expect(target.target_type).to eq('by_school')
        expect(target.high_school_id).to eq(teacher.high_school_id)
      end

      it 'メッセージが返る' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['message']).to eq('お知らせを下書きで作成しました。')
      end

      it 'titleが保存される' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        announcement = Announcement.last

        expect(announcement.title).to eq('テストタイトル')
      end

      it 'contentが保存される' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        announcement = Announcement.last

        expect(announcement.content).to eq('テスト内容')
      end
    end

    context '異常系 - titleが空' do
      before do
        params[:announcement][:title] = ''
      end

      it '422が返る' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '異常系 - 不正なtarget_type' do
      before do
        params[:announcement][:announcement_targets] = [
          {
            target_type: 'invalid'
          }
        ]
      end

      it '422が返る' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '異常系 - 未認証' do
      it '401が返る' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - teacher以外' do
      let!(:student) { create(:user) }
      let(:cookie) { login_and_get_cookie(student) }

      it '403が返る' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context '異常系 - contentが空' do
      before do
        params[:announcement][:content] = ''
      end

      it '422が返る' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '異常系 - announcement_targetsが配列ではない' do
      before do
        params[:announcement][:announcement_targets] = 'invalid'
      end

      it '422が返る' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '異常系 - announcement_targetsが空' do
      before do
        params[:announcement][:announcement_targets] = []
      end

      it '422が返る' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end
  end

  describe 'PATCH /api/v1/teacher/announcements/:id' do
    let!(:teacher) { create(:user, :teacher) }
    let(:cookie) { login_and_get_cookie(teacher) }

    let!(:announcement) do
      create(
        :announcement,
        :draft,
        publisher: teacher
      )
    end

    let(:params) do
      {
        announcement: {
          status: 'published'
        }
      }
    end

    context '正常系' do
      it '200が返る' do
        patch "/api/v1/teacher/announcements/#{announcement.id}",
              params: params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it 'statusが更新される' do
        patch "/api/v1/teacher/announcements/#{announcement.id}",
              params: params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(announcement.reload.status).to eq('published')
      end

      it 'publishedにしたときpublished_atが設定される' do
        freeze_time do
          patch "/api/v1/teacher/announcements/#{announcement.id}",
                params: {
                  announcement: { status: 'published' }
                }.to_json,
                headers: headers.merge('Cookie' => cookie)

          announcement.reload
          expect(announcement.published_at).to eq(Time.current)
        end
      end

      it '既にpublished_atがある場合は更新されない' do
        time = 1.day.ago
        announcement.update!(published_at: time)

        patch "/api/v1/teacher/announcements/#{announcement.id}",
              params: {
                announcement: { status: 'published' }
              }.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(announcement.reload.published_at.to_i).to eq(time.to_i)
      end

      it 'scheduled_atが更新される' do
        time = 2.days.from_now

        patch "/api/v1/teacher/announcements/#{announcement.id}",
              params: {
                announcement: {
                  status: 'scheduled',
                  scheduled_at: time
                }
              }.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(announcement.reload.scheduled_at.to_i).to eq(time.to_i)
      end

      it 'draftからscheduledに変更できる' do
        patch "/api/v1/teacher/announcements/#{announcement.id}",
              params: {
                announcement: { status: 'scheduled', scheduled_at: 1.day.from_now }
              }.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(announcement.reload.status).to eq('scheduled')
      end

      it 'scheduledからpublishedに変更できる' do
        announcement.update!(status: :scheduled, scheduled_at: 1.minute.from_now)

        patch "/api/v1/teacher/announcements/#{announcement.id}",
              params: {
                announcement: { status: 'published' }
              }.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(announcement.reload.status).to eq('published')
      end

      it 'メッセージが返る' do
        patch "/api/v1/teacher/announcements/#{announcement.id}",
              params: params.to_json,
              headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['message']).to eq('お知らせのステータスを更新しました。')
      end
    end

    context '異常系 - 不正なstatus' do
      let(:params) do
        {
          announcement: {
            status: 'invalid'
          }
        }
      end

      it '422が返る' do
        patch "/api/v1/teacher/announcements/#{announcement.id}",
              params: params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '異常系 - 未認証' do
      it '401が返る' do
        patch "/api/v1/teacher/announcements/#{announcement.id}",
              params: params.to_json,
              headers: headers

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - teacher以外' do
      let!(:student) { create(:user) }
      let(:cookie) { login_and_get_cookie(student) }

      it '403が返る' do
        patch "/api/v1/teacher/announcements/#{announcement.id}",
              params: params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context '異常系 - 自分のお知らせではない' do
      let!(:other_teacher) { create(:user, :teacher) }

      let!(:announcement) do
        create(
          :announcement,
          :draft,
          publisher: other_teacher
        )
      end

      it '404が返る' do
        patch "/api/v1/teacher/announcements/#{announcement.id}",
              params: params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
