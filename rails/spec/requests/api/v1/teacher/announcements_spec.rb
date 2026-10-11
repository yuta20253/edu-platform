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

      context 'tab=authored の場合' do
        let!(:scheduled_announcements) do
          create_list(:announcement, 2, :scheduled, publisher: teacher).map do |a|
            create(:announcement_target, :all_users, announcement: a)
            a
          end
        end

        it '自分が作成したお知らせが返る' do
          get '/api/v1/teacher/announcements',
              params: { tab: 'authored' },
              headers: headers.merge('Cookie' => cookie)

          json = response.parsed_body

          returned_ids = json['announcements'].pluck('id')

          expect(returned_ids).to match_array(
            (
              announcements +
              draft_announcements +
              scheduled_announcements +
              student_announcements
            ).map(&:id)
          )
        end

        it 'draft が返る' do
          get '/api/v1/teacher/announcements',
              params: { tab: 'authored' },
              headers: headers.merge('Cookie' => cookie)

          json = response.parsed_body

          returned_ids = json['announcements'].pluck('id')

          expect(returned_ids).to include(*draft_announcements.map(&:id))
        end

        it 'scheduled が返る' do
          get '/api/v1/teacher/announcements',
              params: { tab: 'authored' },
              headers: headers.merge('Cookie' => cookie)

          json = response.parsed_body

          returned_ids = json['announcements'].pluck('id')

          expect(returned_ids).to include(*scheduled_announcements.map(&:id))
        end

        it '他人が作成したお知らせは返らない' do
          get '/api/v1/teacher/announcements',
              params: { tab: 'authored' },
              headers: headers.merge('Cookie' => cookie)

          json = response.parsed_body

          returned_ids = json['announcements'].pluck('id')

          expect(returned_ids).not_to include(
            *other_school_announcements.map(&:id),
            *other_user_announcements.map(&:id)
          )
        end

        it 'publisher情報は返らない' do
          get '/api/v1/teacher/announcements',
              params: { tab: 'authored' },
              headers: headers.merge('Cookie' => cookie)

          json = response.parsed_body

          expect(json['announcements'].first).not_to have_key('publisher')
        end

        context 'システムが自動生成した通知(面談確定等)が自分宛にpublisherとして記録されている場合' do
          let!(:system_generated_announcement) do
            a = create(:announcement, :published, :system_generated, publisher: teacher)
            create(:announcement_target, :by_user, announcement: a, user_id: teacher.id)
            a
          end

          it '自分が作成したお知らせ一覧には含まれない' do
            get '/api/v1/teacher/announcements',
                params: { tab: 'authored' },
                headers: headers.merge('Cookie' => cookie)

            json = response.parsed_body
            returned_ids = json['announcements'].pluck('id')

            expect(returned_ids).not_to include(system_generated_announcement.id)
          end
        end
      end

      it 'publishedタブではpublisher情報が返る' do
        get '/api/v1/teacher/announcements',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['announcements'].first).to have_key('publisher')
      end

      it 'unknown tabはpublishedにフォールバックされる' do
        get '/api/v1/teacher/announcements',
            params: { tab: 'unknown' },
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body
        returned_ids = json['announcements'].pluck('id')

        expected_ids = Announcement.for_user(teacher).published.pluck(:id)

        expect(returned_ids).to match_array(expected_ids)
      end

      context '並び順' do
        let!(:high_school) { create(:high_school) }

        let!(:teacher) { create(:user, :teacher, high_school: high_school) }
        let(:cookie) { login_and_get_cookie(teacher) }

        before do
          AnnouncementTarget.delete_all
        end

        it 'published_atの降順で返る' do
          old = create(:announcement, :published, publisher: teacher, published_at: 2.days.ago)
          new = create(:announcement, :published, publisher: teacher, published_at: 1.day.ago)

          create(:announcement_target, :all_users, announcement: old)
          create(:announcement_target, :all_users, announcement: new)

          get '/api/v1/teacher/announcements',
              headers: headers.merge('Cookie' => cookie)

          json = response.parsed_body

          ids = json['announcements'].first(2).pluck('id')

          expect(ids).to eq([new.id, old.id])
        end
      end

      context 'ページネーション' do
        before do
          create_list(:announcement, 25, :published, publisher: teacher).each do |a|
            create(:announcement_target, :all_users, announcement: a)
          end
        end

        it '1ページ20件返る' do
          get '/api/v1/teacher/announcements',
              headers: headers.merge('Cookie' => cookie)

          json = response.parsed_body

          expect(json['announcements'].size).to eq(20)
        end

        it 'page=2で2ページ目が返る' do
          get '/api/v1/teacher/announcements',
              params: { page: 2 },
              headers: headers.merge('Cookie' => cookie)

          json = response.parsed_body

          expect(json['meta']['current_page']).to eq(2)
          expect(json['announcements'].size).to be_positive
        end

        it 'meta情報に総件数が返る' do
          get '/api/v1/teacher/announcements',
              headers: headers.merge('Cookie' => cookie)

          json = response.parsed_body

          expect(json['meta']['total_count']).to eq(28)
          expect(json['meta']['total_pages']).to eq(2)
        end
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

  describe 'GET /api/v1/teacher/announcements/new' do
    let!(:high_school) { create(:high_school) }
    let!(:grade1) { create(:grade, high_school: high_school, year: 1) }
    let!(:grade2) { create(:grade, high_school: high_school, year: 2) }
    let!(:guardian_role) { create(:user_role, :guardian) }

    let!(:teacher) { create(:user, :teacher, high_school: high_school, grade: grade1) }
    let(:cookie) { login_and_get_cookie(teacher) }

    let!(:student_in_grade1) do
      create(:user, :student, high_school: high_school, grade: grade1,
                              name: '山田太郎', name_kana: 'ヤマダタロウ')
    end

    let!(:student_in_grade2) do
      create(:user, :student, high_school: high_school, grade: grade2,
                              name: '鈴木花子', name_kana: 'スズキハナコ')
    end

    context 'all_gradesの教員の場合' do
      let!(:teacher_permission) { create(:teacher_permission, user: teacher, grade_scope: :all_grades) }

      it '200が返る' do
        get '/api/v1/teacher/announcements/new',
            headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it 'grades/user_roles/students/own_grade_restrictionが返る' do
        get '/api/v1/teacher/announcements/new',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json.keys).to include('grades', 'user_roles', 'students', 'own_grade_restriction')
      end

      it '高校の全学年が返る' do
        get '/api/v1/teacher/announcements/new',
            headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['grades'].pluck('id')).to contain_exactly(grade1.id, grade2.id)
      end

      it 'own_grade_restrictionはnullになる' do
        get '/api/v1/teacher/announcements/new',
            headers: headers.merge('Cookie' => cookie)

        expect(response.parsed_body['own_grade_restriction']).to be_nil
      end

      it '全学年の生徒が返る' do
        get '/api/v1/teacher/announcements/new',
            headers: headers.merge('Cookie' => cookie)

        ids = response.parsed_body['students']['items'].pluck('id')

        expect(ids).to contain_exactly(student_in_grade1.id, student_in_grade2.id)
      end

      it 'user_rolesにadminとguardianが含まれない' do
        get '/api/v1/teacher/announcements/new',
            headers: headers.merge('Cookie' => cookie)

        names = response.parsed_body['user_roles'].pluck('name')

        expect(names).to contain_exactly('student', 'teacher')
      end

      it 'user_rolesにidが含まれる' do
        get '/api/v1/teacher/announcements/new',
            headers: headers.merge('Cookie' => cookie)

        expect(response.parsed_body['user_roles'].first).to have_key('id')
      end
    end

    context 'own_gradeの教員の場合' do
      let!(:teacher_permission) { create(:teacher_permission, user: teacher, grade_scope: :own_grade) }

      it '自分の学年のみ返る' do
        get '/api/v1/teacher/announcements/new',
            headers: headers.merge('Cookie' => cookie)

        expect(response.parsed_body['grades'].pluck('id')).to eq([grade1.id])
      end

      it 'own_grade_restrictionに自分の学年idが入る' do
        get '/api/v1/teacher/announcements/new',
            headers: headers.merge('Cookie' => cookie)

        expect(response.parsed_body['own_grade_restriction']).to eq(grade1.id)
      end

      it '自分の学年の生徒のみ返る' do
        get '/api/v1/teacher/announcements/new',
            headers: headers.merge('Cookie' => cookie)

        ids = response.parsed_body['students']['items'].pluck('id')

        expect(ids).to contain_exactly(student_in_grade1.id)
      end
    end

    context 'keywordを指定した場合' do
      let!(:teacher_permission) { create(:teacher_permission, user: teacher, grade_scope: :all_grades) }

      it '名前で絞り込める' do
        get '/api/v1/teacher/announcements/new',
            params: { keyword: '山田' },
            headers: headers.merge('Cookie' => cookie)

        ids = response.parsed_body['students']['items'].pluck('id')

        expect(ids).to contain_exactly(student_in_grade1.id)
      end

      it '名前カナで絞り込める' do
        get '/api/v1/teacher/announcements/new',
            params: { keyword: 'スズキ' },
            headers: headers.merge('Cookie' => cookie)

        ids = response.parsed_body['students']['items'].pluck('id')

        expect(ids).to contain_exactly(student_in_grade2.id)
      end

      it '該当しない場合は空になる' do
        get '/api/v1/teacher/announcements/new',
            params: { keyword: '該当なし' },
            headers: headers.merge('Cookie' => cookie)

        expect(response.parsed_body['students']['items']).to eq([])
      end
    end

    context 'ページネーション' do
      let!(:teacher_permission) { create(:teacher_permission, user: teacher, grade_scope: :all_grades) }

      it 'students.metaに総件数・現在ページ・1ページ件数が返る' do
        get '/api/v1/teacher/announcements/new',
            headers: headers.merge('Cookie' => cookie)

        meta = response.parsed_body['students']['meta']

        expect(meta['total_count']).to eq(2)
        expect(meta['current_page']).to eq(1)
        expect(meta['per_page']).to eq(20)
      end
    end

    context '別高校のデータの場合' do
      let!(:teacher_permission) { create(:teacher_permission, user: teacher, grade_scope: :all_grades) }
      let!(:other_high_school) { create(:high_school) }
      let!(:other_grade) { create(:grade, high_school: other_high_school) }
      let!(:other_school_student) { create(:user, :student, high_school: other_high_school, grade: other_grade) }

      it '別高校の学年は含まれない' do
        get '/api/v1/teacher/announcements/new',
            headers: headers.merge('Cookie' => cookie)

        expect(response.parsed_body['grades'].pluck('id')).not_to include(other_grade.id)
      end

      it '別高校の生徒は含まれない' do
        get '/api/v1/teacher/announcements/new',
            headers: headers.merge('Cookie' => cookie)

        ids = response.parsed_body['students']['items'].pluck('id')

        expect(ids).not_to include(other_school_student.id)
      end
    end

    context '異常系 - 未認証' do
      it '401が返る' do
        get '/api/v1/teacher/announcements/new',
            headers: headers

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - teacher以外' do
      let!(:student) { create(:user, :student) }
      let(:cookie) { login_and_get_cookie(student) }

      it '403が返る' do
        get '/api/v1/teacher/announcements/new',
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

      it 'all_usersの場合も他校に配信されないよう自校のhigh_school_idが保存される' do
        params[:announcement][:announcement_targets] = [{ target_type: 'all_users' }]

        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        target = AnnouncementTarget.last

        expect(target.target_type).to eq('all_users')
        expect(target.high_school_id).to eq(teacher.high_school_id)
      end

      it 'by_roleの場合も他校に配信されないよう自校のhigh_school_idが保存される' do
        params[:announcement][:announcement_targets] = [
          { target_type: 'by_role', user_role_id: teacher.user_role_id }
        ]

        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        target = AnnouncementTarget.last

        expect(target.target_type).to eq('by_role')
        expect(target.user_role_id).to eq(teacher.user_role_id)
        expect(target.high_school_id).to eq(teacher.high_school_id)
      end

      it 'メッセージが返る' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['message']).to eq('お知らせを下書きで作成しました。')
      end

      it '作成されたお知らせのannouncement_idが返る' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['announcement_id']).to eq(Announcement.last.id)
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

    context '即時配信(status: published)を指定した場合' do
      before do
        params[:announcement][:status] = 'published'
      end

      it 'publishedで作成されpublished_atが設定される' do
        freeze_time do
          post '/api/v1/teacher/announcements',
               params: params.to_json,
               headers: headers.merge('Cookie' => cookie)

          expect(response).to have_http_status(:created)
          announcement = Announcement.last
          expect(announcement.status).to eq('published')
          expect(announcement.published_at).to eq(Time.current)
        end
      end

      it '配信した旨のメッセージが返る' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response.parsed_body['message']).to eq('お知らせを配信しました。')
      end
    end

    context '予約配信(status: scheduled)を指定した場合' do
      let(:scheduled_at) { 1.day.from_now.change(usec: 0) }

      before do
        params[:announcement][:status] = 'scheduled'
        params[:announcement][:scheduled_at] = scheduled_at.iso8601
      end

      it 'scheduledで作成されscheduled_atが保存される' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:created)
        announcement = Announcement.last
        expect(announcement.status).to eq('scheduled')
        expect(announcement.scheduled_at).to eq(scheduled_at)
      end

      it '予約した旨のメッセージが返る' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response.parsed_body['message']).to eq('お知らせの配信を予約しました。')
      end
    end

    context '異常系 - 予約配信のscheduled_atが過去' do
      before do
        params[:announcement][:status] = 'scheduled'
        params[:announcement][:scheduled_at] = 1.minute.ago.iso8601
      end

      it '422が返る' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it '下書きも残らない' do
        expect do
          post '/api/v1/teacher/announcements',
               params: params.to_json,
               headers: headers.merge('Cookie' => cookie)
        end.not_to change(Announcement, :count)
      end
    end

    context '異常系 - 不正なstatus' do
      before do
        params[:announcement][:status] = 'invalid'
      end

      it '422が返る' do
        post '/api/v1/teacher/announcements',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_entity)
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

        expect(response).to have_http_status(:unprocessable_entity)
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

        expect(response).to have_http_status(:unprocessable_entity)
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

        expect(response).to have_http_status(:unprocessable_entity)
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

        expect(response).to have_http_status(:unprocessable_entity)
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

        expect(response).to have_http_status(:unprocessable_entity)
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

        expect(response).to have_http_status(:unprocessable_entity)
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
