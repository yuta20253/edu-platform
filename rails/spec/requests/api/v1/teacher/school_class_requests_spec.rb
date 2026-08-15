# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Teacher::SchoolClassRequests', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  let!(:high_school) { create(:high_school) }
  let!(:grade) do
    create(
      :grade,
      high_school: high_school
    )
  end
  let!(:teacher) do
    create(:user, :teacher, high_school: high_school)
  end
  let!(:teacher_permission) do
    create(
      :teacher_permission,
      user: teacher,
      manage_other_teachers: true
    )
  end
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

  describe 'POST /api/v1/teacher/school_class_requests' do
    let(:params) do
      {
        school_class_request: {
          name: '1組',
          grade_id: grade.id,
          action: 'creation'
        }
      }
    end

    context '正常系' do
      it '201が返る' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:created)
      end

      it '学級作成申請が作成される' do
        expect do
          post '/api/v1/teacher/school_class_requests',
               params: params.to_json,
               headers: headers.merge('Cookie' => cookie)
        end.to change(SchoolClassRequest, :count).by(1)
      end

      it '申請内容が保存される' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        school_class_request = SchoolClassRequest.last

        expect(school_class_request.applicant).to eq(teacher)
        expect(school_class_request.grade).to eq(grade)
        expect(school_class_request.name).to eq('1組')
        expect(school_class_request.action).to eq('creation')
        expect(school_class_request.status).to eq('pending')
      end

      it '受付完了メッセージが返る' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['message']).to eq('学級作成申請を受け付けました')
      end
    end

    context 'nameが未入力の場合' do
      let(:params) do
        {
          school_class_request: {
            name: '',
            grade_id: grade.id,
            action: 'creation'
          }
        }
      end

      it '422が返る' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end

      it '学級作成申請が作成されない' do
        expect do
          post '/api/v1/teacher/school_class_requests',
               params: params.to_json,
               headers: headers.merge('Cookie' => cookie)
        end.not_to change(SchoolClassRequest, :count)
      end

      it 'エラーメッセージが返る' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['errors']).to include('Name を入力してください')
      end
    end

    context 'grade_idが未入力の場合' do
      let(:params) do
        {
          school_class_request: {
            name: '1組',
            grade_id: nil,
            action: 'creation'
          }
        }
      end

      it '422が返る' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end

      it '学級作成申請が作成されない' do
        expect do
          post '/api/v1/teacher/school_class_requests',
               params: params.to_json,
               headers: headers.merge('Cookie' => cookie)
        end.not_to change(SchoolClassRequest, :count)
      end
    end

    context '他高校のgrade_idを指定した場合' do
      let!(:other_high_school) { create(:high_school) }

      let!(:other_grade) do
        create(
          :grade,
          high_school: other_high_school
        )
      end

      let(:params) do
        {
          school_class_request: {
            name: '1組',
            grade_id: other_grade.id,
            action: 'creation'
          }
        }
      end

      it '422が返る' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:unprocessable_content)
      end

      it '学級作成申請が作成されない' do
        expect do
          post '/api/v1/teacher/school_class_requests',
               params: params.to_json,
               headers: headers.merge('Cookie' => cookie)
        end.not_to change(SchoolClassRequest, :count)
      end
    end

    context '未認証の場合' do
      it 'アクセスできない' do
        post '/api/v1/teacher/school_class_requests',
             params: params.to_json,
             headers: headers

        expect(response).not_to have_http_status(:created)
      end
    end
  end

  describe 'PATCH /api/v1/teacher/school_class_requests/:id' do
    let!(:school_class_request) do
      create(
        :school_class_request,
        applicant: teacher,
        grade: grade,
        action: :creation,
        status: :pending,
        name: '1組'
      )
    end

    let(:request_lock_version) { school_class_request.lock_version }

    let(:request_params) do
      {
        school_class_request: {
          status: status,
          lock_version: request_lock_version
        }
      }
    end

    context '承認する場合' do
      let(:status) { 'approved' }

      it '200が返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it '申請が承認済みになる' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(school_class_request.reload.status).to eq('approved')
      end

      it '承認者が保存される' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(school_class_request.reload.approver).to eq(teacher)
      end

      it 'approved_atが保存される' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(school_class_request.reload.approved_at).to be_present
      end

      it '学級が作成される' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => cookie)
        end.to change(SchoolClass, :count).by(1)
      end

      it '申請の内容で学級が作成される' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => cookie)

        school_class = SchoolClass.last

        expect(school_class.grade).to eq(grade)
        expect(school_class.name).to eq('1組')
      end

      it '承認メッセージが返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['message']).to eq('申請が承認されました')
      end
    end

    context '却下する場合' do
      let(:status) { 'rejected' }

      it '200が返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it '申請が却下済みになる' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(school_class_request.reload.status).to eq('rejected')
      end

      it 'approved_atが保存されない' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(school_class_request.reload.approved_at).to be_nil
      end

      it '学級が作成されない' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => cookie)
        end.not_to change(SchoolClass, :count)
      end

      it '却下メッセージが返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['message']).to eq('申請が却下されました')
      end
    end

    context '承認権限がない場合' do
      before do
        teacher.teacher_permission.update!(manage_other_teachers: false)
      end

      let(:status) { 'approved' }

      it '403が返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:forbidden)
      end

      it '申請が更新されない' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => cookie)
        end.not_to(change do
          school_class_request.reload.updated_at
        end)
      end
    end

    context '他高校の申請の場合' do
      let!(:other_high_school) { create(:high_school) }

      let!(:other_grade) do
        create(
          :grade,
          high_school: other_high_school
        )
      end

      let!(:other_teacher) do
        create(
          :user,
          :teacher,
          high_school: other_high_school
        )
      end

      let!(:other_school_class_request) do
        create(
          :school_class_request,
          applicant: other_teacher,
          grade: other_grade,
          action: :creation,
          status: :pending,
          name: '1組'
        )
      end

      let(:status) { 'approved' }

      it '404が返る' do
        patch "/api/v1/teacher/school_class_requests/#{other_school_class_request.id}",
              params: {
                school_class_request: {
                  status: status,
                  lock_version: other_school_class_request.lock_version
                }
              }.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end

      it '他高校の申請は更新されない' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{other_school_class_request.id}",
                params: {
                  school_class_request: {
                    status: status,
                    lock_version: other_school_class_request.lock_version
                  }
                }.to_json,
                headers: headers.merge('Cookie' => cookie)
        end.not_to(change do
          other_school_class_request.reload.status
        end)
      end
    end

    context '申請がpendingではない場合' do
      let(:status) { 'approved' }

      before do
        school_class_request.update!(status: :approved)
      end

      it '200が返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:ok)
      end

      it '申請が更新されない' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => cookie)
        end.not_to(change do
          school_class_request.reload.status
        end)
      end

      it '学級が作成されない' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => cookie)
        end.not_to change(SchoolClass, :count)
      end
    end

    context 'lock_versionが古い場合' do
      let(:status) { 'approved' }
      let(:request_lock_version) { 0 }

      before do
        school_class_request.update_column(
          :lock_version,
          school_class_request.lock_version + 1
        )
      end

      it '409が返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:conflict)
      end

      it 'エラーメッセージが返る' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers.merge('Cookie' => cookie)

        json = response.parsed_body

        expect(json['errors']).to include(
          '他のユーザーによってデータが更新されています。再読み込みしてください'
        )
      end

      it '申請が更新されない' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => cookie)
        end.not_to(change do
          school_class_request.reload.status
        end)
      end

      it '学級が作成されない' do
        expect do
          patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
                params: request_params.to_json,
                headers: headers.merge('Cookie' => cookie)
        end.not_to change(SchoolClass, :count)
      end
    end

    context '未認証の場合' do
      let(:status) { 'approved' }

      it 'アクセスできない' do
        patch "/api/v1/teacher/school_class_requests/#{school_class_request.id}",
              params: request_params.to_json,
              headers: headers

        expect(response).not_to have_http_status(:ok)
      end
    end

    context '存在しない申請の場合' do
      let(:status) { 'approved' }

      it '404が返る' do
        patch '/api/v1/teacher/school_class_requests/999999',
              params: {
                school_class_request: {
                  status: status,
                  lock_version: 0
                }
              }.to_json,
              headers: headers.merge('Cookie' => cookie)

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
