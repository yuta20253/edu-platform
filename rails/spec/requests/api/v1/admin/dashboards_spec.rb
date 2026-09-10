# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Dashboards', type: :request do
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

  describe 'GET /api/v1/admin/dashboard' do
    context '正常系' do
      subject { get '/api/v1/admin/dashboard', headers: headers.merge('Cookie' => cookie) }

      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let!(:students)   { create_list(:user, 3) }
      let!(:teachers)   { create_list(:user, 2, :teacher) }
      let!(:unit)       { create(:unit) }
      let!(:questions)  { create_list(:question, 4, unit: unit) }
      let!(:imports)    { create_list(:import_history, 6, user: admin_user, unit: unit) }

      let(:cookie) { login_and_get_cookie(admin_user) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it 'stats.student_count が正しい' do
        subject
        expect(response.parsed_body.dig('stats', 'student_count')).to eq(3)
      end

      it 'stats.teacher_count が正しい' do
        subject
        expect(response.parsed_body.dig('stats', 'teacher_count')).to eq(2)
      end

      it 'stats.admin_count が正しい' do
        subject
        expect(response.parsed_body.dig('stats', 'admin_count')).to eq(1)
      end

      it 'stats.total_questions が正しい' do
        subject
        expect(response.parsed_body.dig('stats', 'total_questions')).to eq(4)
      end

      it 'stats に必要なキーが揃っている' do
        subject
        expect(response.parsed_body['stats'].keys).to contain_exactly(
          'student_count', 'active_student_count', 'teacher_count', 'admin_count',
          'total_questions', 'pending_student_count', 'pending_teacher_count'
        )
      end

      it 'meta.active_student_period_days が返される' do
        subject
        expect(response.parsed_body.dig('meta', 'active_student_period_days')).to eq(30)
      end

      it 'meta.generated_at が返される' do
        subject
        expect(response.parsed_body.dig('meta', 'generated_at')).to be_present
      end

      it 'recent_imports は最大5件返される' do
        subject
        expect(response.parsed_body['recent_imports'].size).to eq(5)
      end

      it 'recent_imports に必要なフィールドが含まれる' do
        subject
        import = response.parsed_body['recent_imports'].first
        expect(import.keys).to include('id', 'file_name', 'status', 'success_count', 'error_count', 'total_count',
                                       'created_at')
      end

      context 'アクティブ生徒数' do
        def create_study_log_for(user, **attrs)
          create(:study_log, user: user, task: create(:task, user: user), **attrs)
        end

        it '過去30日以内に学習活動のある生徒だけを数える' do
          create_study_log_for(students.first, started_at: 10.days.ago)
          create_study_log_for(students.second, started_at: 31.days.ago)

          subject
          expect(response.parsed_body.dig('stats', 'active_student_count')).to eq(1)
        end
      end

      context '招待中のユーザーが存在する場合' do
        let!(:pending_students) { create_list(:user, 2, :invitation_pending) }
        let!(:pending_teacher)  { create(:user, :teacher, :invitation_pending) }

        it 'student_count / teacher_count に含めない' do
          subject
          expect(response.parsed_body['stats']).to include('student_count' => 3, 'teacher_count' => 2)
        end

        it 'pending_student_count / pending_teacher_count に計上する' do
          subject
          expect(response.parsed_body['stats']).to include(
            'pending_student_count' => 2, 'pending_teacher_count' => 1
          )
        end
      end

      context '論理削除済みのユーザーが存在する場合' do
        let!(:deleted_student) { create(:user, deleted_at: Time.current) }
        let!(:deleted_teacher) { create(:user, :teacher, deleted_at: Time.current) }

        it 'KPIの人数に含めない' do
          subject
          expect(response.parsed_body['stats']).to include('student_count' => 3, 'teacher_count' => 2)
        end
      end

      context 'お知らせが存在する場合' do
        let!(:announcements) do
          Array.new(4) { |i| create(:announcement, publisher: admin_user, created_at: i.days.ago) }
        end

        it 'recent_announcements は最大3件返される' do
          subject
          expect(response.parsed_body['recent_announcements'].size).to eq(3)
        end

        it 'recent_announcements は作成日時の降順で返される' do
          subject
          ids = response.parsed_body['recent_announcements'].pluck('id')
          expect(ids).to eq(announcements.first(3).map(&:id))
        end

        it 'recent_announcements に必要なフィールドが含まれる' do
          subject
          announcement = response.parsed_body['recent_announcements'].first
          expect(announcement.keys).to contain_exactly(
            'id', 'title', 'status', 'published_at', 'scheduled_at', 'created_at'
          )
        end

        it 'recent_announcements は下書き・予約配信も含む' do
          create(:announcement, :scheduled, publisher: admin_user, created_at: 1.hour.ago)

          subject
          statuses = response.parsed_body['recent_announcements'].pluck('status')
          expect(statuses).to include('scheduled')
        end
      end

      context 'お知らせが存在しない場合' do
        it 'recent_announcements は空配列を返す' do
          subject
          expect(response.parsed_body['recent_announcements']).to eq([])
        end
      end

      context '教員による生徒CSVインポート履歴が含まれる場合' do
        let!(:teacher) { create(:user, :teacher, high_school: create(:high_school)) }
        let!(:student_import) do
          create(:import_history, user: teacher, unit: nil, import_type: :student)
        end

        it 'recent_imports から生徒CSVインポート履歴が除外される' do
          subject
          ids = response.parsed_body['recent_imports'].pluck('id')
          expect(ids).not_to include(student_import.id)
        end
      end
    end

    context '異常系 - 未認証アクセス' do
      it '401が返される' do
        get '/api/v1/admin/dashboard', headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 管理者以外のアクセス（生徒）' do
      let!(:student_user) { create(:user) }

      it '403が返される' do
        cookie = login_and_get_cookie(student_user)
        get '/api/v1/admin/dashboard', headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
