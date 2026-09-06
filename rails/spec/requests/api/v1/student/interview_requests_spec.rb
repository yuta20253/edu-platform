# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Student::InterviewRequests', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  let!(:high_school) { create(:high_school) }
  let!(:grade) { create(:grade, high_school: high_school) }
  let!(:school_class) { create(:school_class, grade: grade) }
  let!(:teacher) { create(:user, :teacher, high_school: high_school) }
  let!(:teacher_school_class) { create(:teacher_school_class, user: teacher, school_class: school_class) }
  let!(:student) do
    create(:user, :student, high_school: high_school, grade: grade, school_class: school_class)
  end
  let(:cookie) { login_and_get_cookie(student) }

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: {
           email: user.email,
           password: 'password'
         }.to_json,
         headers: headers

    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/student/interview_requests' do
    let!(:own_request) { create(:interview_request, :initiated_by_teacher, teacher: teacher, student: student) }
    let!(:other_student_request) { create(:interview_request, :initiated_by_teacher) }

    it '200が返る' do
      get '/api/v1/student/interview_requests', headers: headers.merge('Cookie' => cookie)

      expect(response).to have_http_status(:ok)
    end

    it '自分宛の面談のみ返る' do
      get '/api/v1/student/interview_requests', headers: headers.merge('Cookie' => cookie)

      ids = response.parsed_body['interview_requests'].pluck('id')
      expect(ids).to contain_exactly(own_request.id)
    end
  end

  describe 'POST /api/v1/student/interview_requests' do
    let(:params) do
      {
        interview_request: {
          teacher_id: teacher.id,
          reason_category: 'study_method',
          reason_detail: '勉強方法について相談したい'
        }
      }
    end

    context '正常系' do
      it '201が返る' do
        post '/api/v1/student/interview_requests', params: params.to_json, headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:created)
      end

      it '面談申請が作成される' do
        expect do
          post '/api/v1/student/interview_requests', params: params.to_json,
                                                     headers: headers.merge('Cookie' => cookie)
        end.to change(InterviewRequest, :count).by(1)
      end

      it '申請内容が保存される' do
        post '/api/v1/student/interview_requests', params: params.to_json, headers: headers.merge('Cookie' => cookie)

        interview_request = InterviewRequest.last
        expect(interview_request.student).to eq(student)
        expect(interview_request.teacher).to eq(teacher)
        expect(interview_request.initiator_role).to eq('student')
        expect(interview_request.reason_category).to eq('study_method')
      end
    end

    context '所属クラスの担当ではない教員を指定した場合' do
      let!(:other_teacher) { create(:user, :teacher, high_school: high_school) }
      let(:params) do
        {
          interview_request: {
            teacher_id: other_teacher.id,
            reason_category: 'study_method',
            reason_detail: '相談したい'
          }
        }
      end

      it '422が返る' do
        post '/api/v1/student/interview_requests', params: params.to_json, headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '未認証の場合' do
      it 'アクセスできない' do
        post '/api/v1/student/interview_requests', params: params.to_json, headers: headers

        expect(response).not_to have_http_status(:created)
      end
    end
  end

  describe 'DELETE /api/v1/student/interview_requests/:id' do
    let!(:interview_request) do
      create(:interview_request, :initiated_by_teacher, teacher: teacher, student: student, status: :requested)
    end

    context '本人が取り消す場合' do
      it '200が返る' do
        delete "/api/v1/student/interview_requests/#{interview_request.id}", headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it 'cancelledになる' do
        delete "/api/v1/student/interview_requests/#{interview_request.id}", headers: headers.merge('Cookie' => cookie)

        expect(interview_request.reload.status).to eq('cancelled')
      end
    end

    context '他の生徒の面談の場合' do
      let!(:other_student) { create(:user, :student, high_school: high_school) }
      let(:other_cookie) { login_and_get_cookie(other_student) }

      it '404が返る' do
        delete "/api/v1/student/interview_requests/#{interview_request.id}",
               headers: headers.merge('Cookie' => other_cookie)

        expect(response).to have_http_status(:not_found)
      end
    end

    context '未認証の場合' do
      it 'アクセスできない' do
        delete "/api/v1/student/interview_requests/#{interview_request.id}", headers: headers

        expect(response).not_to have_http_status(:ok)
      end
    end
  end
end
