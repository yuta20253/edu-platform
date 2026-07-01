# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Announcements', type: :request do
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

  describe 'GET /api/v1/admin/high_schools/:high_school_id/announcements' do
    context '正常系' do
      subject do
        get "/api/v1/admin/high_schools/#{school.id}/announcements",
            headers: headers.merge('Cookie' => cookie)
      end

      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let!(:publisher) do
        create(:user, :admin, high_school: nil, name: '配信者太郎', name_kana: 'ハイシンシャタロウ')
      end
      let!(:school) { create(:high_school) }
      let!(:announcement) do
        ann = create(:announcement, publisher: publisher)
        create(:announcement_target, announcement: ann, target_type: :by_school, high_school_id: school.id)
        ann
      end
      let(:cookie) { login_and_get_cookie(admin_user) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it 'announcements キーが含まれる' do
        subject
        expect(response.parsed_body).to have_key('announcements')
      end

      it '各お知らせに必要なフィールドが含まれる' do
        subject
        data = response.parsed_body['announcements'].first
        expect(data.keys).to include(
          'id', 'title', 'content', 'status', 'published_at', 'scheduled_at',
          'created_at', 'publisher', 'targets'
        )
      end

      it 'publisher に配信者名が含まれる' do
        subject
        data = response.parsed_body['announcements'].first
        expect(data['publisher']['name']).to eq('配信者太郎')
        expect(data['publisher']['name_kana']).to eq('ハイシンシャタロウ')
      end

      it 'targets が配列で返される' do
        subject
        data = response.parsed_body['announcements'].first
        expect(data['targets']).to be_an(Array)
        expect(data['targets'].first['high_school_id']).to eq(school.id)
      end

      it '他校をターゲットにした行は targets に含まれない' do
        other_school = create(:high_school)
        create(:announcement_target, announcement: announcement, target_type: :by_school,
                                     high_school_id: other_school.id)
        subject
        data = response.parsed_body['announcements'].find { |a| a['id'] == announcement.id }
        school_ids = data['targets'].pluck('high_school_id')
        expect(school_ids).to all(eq(school.id))
      end

      it 'status が文字列で返される' do
        subject
        data = response.parsed_body['announcements'].first
        expect(data['status']).to eq('draft')
      end

      it '対象高校をターゲットにしたお知らせのみ返される' do
        other_school = create(:high_school)
        other_ann = create(:announcement, publisher: publisher)
        create(:announcement_target, announcement: other_ann, target_type: :by_school,
                                     high_school_id: other_school.id)
        subject
        ids = response.parsed_body['announcements'].pluck('id')
        expect(ids).to contain_exactly(announcement.id)
      end

      it '全体配信のお知らせは含まれない' do
        all_ann = create(:announcement, publisher: publisher)
        create(:announcement_target, :all_users, announcement: all_ann)
        subject
        ids = response.parsed_body['announcements'].pluck('id')
        expect(ids).not_to include(all_ann.id)
      end

      it 'created_at の降順で返される' do
        newer = create(:announcement, publisher: publisher)
        create(:announcement_target, announcement: newer, target_type: :by_school, high_school_id: school.id)
        newer.update!(created_at: 1.day.from_now)
        subject
        ids = response.parsed_body['announcements'].pluck('id')
        expect(ids).to eq([newer.id, announcement.id])
      end

      it 'created_at が同一の場合は id の降順で返される' do
        same_time = announcement.created_at
        newer = create(:announcement, publisher: publisher)
        create(:announcement_target, announcement: newer, target_type: :by_school, high_school_id: school.id)
        newer.update!(created_at: same_time)
        subject
        ids = response.parsed_body['announcements'].pluck('id')
        expect(ids).to eq([newer.id, announcement.id])
      end
    end

    context '異常系 - 未認証アクセス' do
      let!(:school) { create(:high_school) }

      it '401が返される' do
        get "/api/v1/admin/high_schools/#{school.id}/announcements", headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 管理者以外のアクセス（生徒）' do
      let!(:student_user) { create(:user) }
      let!(:school)       { create(:high_school) }

      it '403が返される' do
        cookie = login_and_get_cookie(student_user)
        get "/api/v1/admin/high_schools/#{school.id}/announcements",
            headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end

    context '異常系 - 存在しない high_school_id' do
      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let(:cookie) { login_and_get_cookie(admin_user) }

      it '404が返される' do
        get '/api/v1/admin/high_schools/0/announcements',
            headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
