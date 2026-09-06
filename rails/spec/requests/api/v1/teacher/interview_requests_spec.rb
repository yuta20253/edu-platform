# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Teacher::InterviewRequests', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  let!(:high_school) { create(:high_school) }
  let!(:teacher) do
    create(:user, :teacher, high_school: high_school).tap do |t|
      create(:teacher_permission, user: t, grade_scope: :all_grades)
    end
  end
  let!(:student) { create(:user, :student, high_school: high_school) }
  let(:cookie) { login_and_get_cookie(teacher) }

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: {
           email: user.email,
           password: 'password'
         }.to_json,
         headers: headers

    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/teacher/interview_requests' do
    let!(:own_request) { create(:interview_request, :initiated_by_teacher, teacher: teacher, student: student) }
    let!(:other_teacher_request) { create(:interview_request, :initiated_by_teacher) }

    it '200が返る' do
      get '/api/v1/teacher/interview_requests', headers: headers.merge('Cookie' => cookie)

      expect(response).to have_http_status(:ok)
    end

    it '自分が担当する面談のみ返る' do
      get '/api/v1/teacher/interview_requests', headers: headers.merge('Cookie' => cookie)

      ids = response.parsed_body['interview_requests'].pluck('id')
      expect(ids).to contain_exactly(own_request.id)
    end
  end

  describe 'POST /api/v1/teacher/interview_requests' do
    let(:params) do
      {
        interview_request: {
          student_id: student.id,
          reason_detail: '最近元気がなさそうなので話を聞きたい'
        }
      }
    end

    context '正常系' do
      it '201が返る' do
        post '/api/v1/teacher/interview_requests', params: params.to_json, headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:created)
      end

      it '面談申請が作成される' do
        expect do
          post '/api/v1/teacher/interview_requests', params: params.to_json,
                                                     headers: headers.merge('Cookie' => cookie)
        end.to change(InterviewRequest, :count).by(1)
      end

      it '申請内容が保存される' do
        post '/api/v1/teacher/interview_requests', params: params.to_json, headers: headers.merge('Cookie' => cookie)

        interview_request = InterviewRequest.last
        expect(interview_request.teacher).to eq(teacher)
        expect(interview_request.student).to eq(student)
        expect(interview_request.initiator_role).to eq('teacher')
        expect(interview_request.status).to eq('requested')
      end
    end

    context '担当外の生徒を指定した場合' do
      let!(:other_high_school) { create(:high_school) }
      let!(:other_student) { create(:user, :student, high_school: other_high_school) }
      let(:params) do
        { interview_request: { student_id: other_student.id, reason_detail: '相談したい' } }
      end

      it '422が返る' do
        post '/api/v1/teacher/interview_requests', params: params.to_json, headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '未認証の場合' do
      it 'アクセスできない' do
        post '/api/v1/teacher/interview_requests', params: params.to_json, headers: headers

        expect(response).not_to have_http_status(:created)
      end
    end
  end

  describe 'PATCH /api/v1/teacher/interview_requests/:id' do
    let!(:interview_request) do
      create(:interview_request, :initiated_by_teacher, teacher: teacher, student: student, status: :requested)
    end

    context '面談を確定する場合' do
      let(:params) do
        {
          interview_request: {
            status: 'confirmed',
            lock_version: interview_request.lock_version,
            scheduled_at: 1.week.from_now
          }
        }
      end

      it '200が返る' do
        patch "/api/v1/teacher/interview_requests/#{interview_request.id}",
              params: params.to_json, headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it 'confirmedになる' do
        patch "/api/v1/teacher/interview_requests/#{interview_request.id}",
              params: params.to_json, headers: headers.merge('Cookie' => cookie)

        expect(interview_request.reload.status).to eq('confirmed')
      end
    end

    context '指定できないステータスの場合' do
      let(:params) do
        { interview_request: { status: 'cancelled', lock_version: interview_request.lock_version } }
      end

      it '422が返る' do
        patch "/api/v1/teacher/interview_requests/#{interview_request.id}",
              params: params.to_json, headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context 'lock_versionが古い場合' do
      let(:params) do
        {
          interview_request: { status: 'confirmed', lock_version: 0, scheduled_at: 1.week.from_now }
        }
      end

      before { interview_request.update_column(:lock_version, interview_request.lock_version + 1) }

      it '409が返る' do
        patch "/api/v1/teacher/interview_requests/#{interview_request.id}",
              params: params.to_json, headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:conflict)
      end
    end

    context '他の教員が担当する面談の場合' do
      let!(:other_teacher) { create(:user, :teacher, high_school: high_school) }
      let(:other_cookie) { login_and_get_cookie(other_teacher) }
      let(:params) do
        {
          interview_request: { status: 'confirmed', lock_version: interview_request.lock_version,
                               scheduled_at: 1.week.from_now }
        }
      end

      it '404が返る' do
        patch "/api/v1/teacher/interview_requests/#{interview_request.id}",
              params: params.to_json, headers: headers.merge('Cookie' => other_cookie)

        expect(response).to have_http_status(:not_found)
      end
    end

    context '未認証の場合' do
      let(:params) do
        {
          interview_request: { status: 'confirmed', lock_version: interview_request.lock_version,
                               scheduled_at: 1.week.from_now }
        }
      end

      it 'アクセスできない' do
        patch "/api/v1/teacher/interview_requests/#{interview_request.id}", params: params.to_json, headers: headers

        expect(response).not_to have_http_status(:ok)
      end
    end
  end

  describe 'DELETE /api/v1/teacher/interview_requests/:id' do
    let!(:interview_request) do
      create(:interview_request, :initiated_by_teacher, teacher: teacher, student: student, status: :requested)
    end

    context '担当教員が取り消す場合' do
      it '200が返る' do
        delete "/api/v1/teacher/interview_requests/#{interview_request.id}", headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it 'cancelledになる' do
        delete "/api/v1/teacher/interview_requests/#{interview_request.id}", headers: headers.merge('Cookie' => cookie)

        expect(interview_request.reload.status).to eq('cancelled')
      end
    end

    context '既に完了している面談の場合' do
      before { interview_request.update_columns(status: :completed) }

      it '422が返る' do
        delete "/api/v1/teacher/interview_requests/#{interview_request.id}", headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '他の教員が担当する面談の場合' do
      let!(:other_teacher) { create(:user, :teacher, high_school: high_school) }
      let(:other_cookie) { login_and_get_cookie(other_teacher) }

      it '404が返る' do
        delete "/api/v1/teacher/interview_requests/#{interview_request.id}",
               headers: headers.merge('Cookie' => other_cookie)

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
